const keys = Object.keys(data[0]);

// Dimensions du graphique
const width = 928;
const height = keys.length * 120;
const marginTop = 20;
const marginRight = 10;
const marginBottom = 20;
const marginLeft = 10;

// Échelles horizontales pour chaque clé
const x = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [marginLeft, width - marginRight])]));

// Échelle verticale
const y = d3.scalePoint(keys, [marginTop, height - marginBottom]);

// Choisissez une variable pour la couleur ou utilisez une couleur fixe
// Par exemple, utilisons "quality" pour la couleur
const colorScale = d3.scaleSequential(d3.extent(data, d => d["quality"]), d3.interpolateBlues);


// const colorScale = d3.scaleSequential(x.get(keyz).domain(), t => d3.interpolateBrBG(1 - t));
// Création du SVG
const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

// Lignes
const line = d3.line()
    .defined(([, value]) => value != null)
    .x(([key, value]) => x.get(key)(value))
    .y(([key]) => y(key));

const path = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.4)
    .selectAll("path")
    .data(data)
    .join("path")
      .attr("stroke", d => colorScale(d["quality"])) // Utiliser la variable "quality" pour la couleur
      .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])));

// Axes
const axes = svg.append("g")
    .selectAll("g")
    .data(keys)
    .join("g")
      .attr("transform", d => `translate(0,${y(d)})`)
      .each(function(d) { d3.select(this).call(d3.axisBottom(x.get(d))); })
      .call(g => g.append("text")
          .attr("x", marginLeft)
          .attr("y", -6)
          .attr("text-anchor", "start")
          .attr("fill", "currentColor")
          .text(d => d))
      .call(g => g.selectAll("text")
          .clone(true).lower()
          .attr("fill", "none")
          .attr("stroke-width", 5)
          .attr("stroke-linejoin", "round")
          .attr("stroke", "white"));

// Comportement de brossage
const deselectedColor = "#ddd";
const brushHeight = 50;
const parallelBrush = d3.brushX()
    .extent([
        [marginLeft, -(brushHeight / 2)],
        [width - marginRight, brushHeight / 2]
    ])
    .on("start brush end", brushed);

axes.call(parallelBrush);

const selections = new Map();

function brushed({selection}, key) {
    if (selection === null) selections.delete(key);
    else selections.set(key, selection.map(x.get(key).invert));
    const selected = [];
    path.each(function(d) {
        const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
        d3.select(this).style("stroke", active ? colorScale(d["quality"]) : deselectedColor);
        if (active) {
            d3.select(this).raise();
            selected.push(d);
        }
    });
    // Mise à jour du diagramme de dispersion
    updateScatterFromParallel(selected);
    const event = new CustomEvent('parallelSelectionChanged', { detail: selected });
    document.dispatchEvent(event);
    svg.property("value", selected).dispatch("input");
}


function updateParallelFromScatter(selectedPoints) {
    path.style("stroke", d => selectedPoints.includes(d) ? colorScale(d["quality"]) : deselectedColor);
}

function updateParallelFromHistogram(selectedPoints) {
    path.style("stroke", d => selectedPoints.includes(d) ? colorScale(d["quality"]) : deselectedColor);
}


document.getElementById('parallelCoordinates').appendChild(svg.node());
