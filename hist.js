// Initialisation des variables de taille des colonnes et de la courbe de régression
let columnSize = 1;
let regressionCurve = 1;

// Récupération des éléments du DOM pour les curseurs, les champs numériques et la sélection des données
const inputColRange = document.getElementById("columnSizeInput");
const inputColNumber = document.getElementById("columnSizeNumber");
const inputKernelRange = document.getElementById("regressionCurveInput");
const inputKernelNumber = document.getElementById("regressionCurveNumber");
const dataSelect = document.getElementById("dataSelect");

// Déclaration des variables pour le graphique D3
let svg, xScaleLinear, yScaleLinear, colorScaleLinear, xAxis, qualityData;
let width_graph, height_graph, max, min, format;

// Fonction pour calculer la valeur gaussienne, utilisée dans la courbe de régression
function gaussian(x_, mean, sigma) {
    var gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
    var x = (x_ - mean) / sigma;
    return gaussianConstant * Math.exp(-.5 * x * x) / sigma;
}

// Fonction pour obtenir la longueur des données, utilisée dans le calcul de l'histogramme
function getLength(data) {
    return data.length;
}

// Fonction pour mettre à jour l'histogramme en fonction de la taille des colonnes
function updateBarHistogram() {
    let numberOfBins = Math.round(Math.min(50, 20 / columnSize)); 

    let datagram = d3.histogram().thresholds(xScaleLinear.ticks(numberOfBins))(qualityData);

    let max_y = d3.max(datagram, d => d.length);
    yScaleLinear.domain([0, max_y]);

    svg.selectAll(".bar").remove(); 

    let bar = svg.selectAll(".bar").data(datagram);

    let barEnter = bar.enter().append("g")
                    .attr("class", "bar")
                    .attr("transform", d => "translate(" + xScaleLinear(d.x0) + ", " + yScaleLinear(d.length) + ")");

    barEnter.append("rect")
            .attr("x", 1)
            .attr("width", d => (xScaleLinear(d.x1) - xScaleLinear(d.x0)) - 1)
            .attr("height", d => height_graph - yScaleLinear(d.length))
            .attr("fill", d => colorScaleLinear(d.length));

    barEnter.append("text")
            .attr("dy", ".75em")
            .attr("y", -12)
            .attr("x", d => (xScaleLinear(d.x1) - xScaleLinear(d.x0)) / 2)
            .attr("text-anchor", "middle")
            .text(d => format(d.length));

    svg.select(".x.axis").call(xAxis);
}

// Fonction pour générer la courbe de régression
function generateRegressionCurve() {
    let regressionPoint = [];
    let curves = svg.selectAll(".regressionCurve");
    curves.remove();

    for (let d_x = 0; d_x <= width_graph; d_x += 1) {
        let dx_value = 0;
        for (let v = 0; v < qualityData.length; v += 1) {
            dx_value += gaussian(d_x / width_graph * (max - min) + min, qualityData[v], regressionCurve);
        }
        regressionPoint.push([d_x / width_graph * (max - min) + min, dx_value]);
    }

    let regressionPointMax = Math.max(...regressionPoint.map(value => value[1]));
    let yRegression = d3.scaleLinear().domain([0, regressionPointMax]).range([height_graph, 0]);
    let curveGenerator = d3.line().x(d => xScaleLinear(d[0])).y(d => yRegression(d[1])).curve(d3.curveBasis);

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("class", "regressionCurve")
        .attr("d", curveGenerator(regressionPoint));
}

// Fonction pour mettre à jour l'histogramme en fonction de la sélection de données
function updateHistogram(selectedData) {
    qualityData = data.map(d => d[selectedData]);
    max = d3.max(qualityData);
    min = d3.min(qualityData);

    xScaleLinear.domain([min, max]);
    updateBarHistogram();
    generateRegressionCurve();
}

// Configuration initiale lors du chargement de la fenêtre
window.addEventListener('load', function () {
    // Génération des options de sélection des données
    Object.keys(data[0]).forEach(key => {
        let option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        dataSelect.appendChild(option);
    });

    // Initialisation avec les données par défaut
    updateHistogram(dataSelect.value);

    // Gestionnaires d'événements pour la sélection des données et les curseurs
    dataSelect.addEventListener('change', function() {
        updateHistogram(dataSelect.value);
    });

    inputColRange.addEventListener('input', function () {
        columnSize = parseFloat(inputColRange.value);
        inputColNumber.value = columnSize;
        updateBarHistogram();
    });

    inputColNumber.addEventListener('input', function () {
        columnSize = parseFloat(inputColNumber.value);
        inputColRange.value = columnSize;
        updateBarHistogram();
    });

    inputKernelRange.addEventListener('input', function () {
        regressionCurve = parseFloat(inputKernelRange.value);
        inputKernelNumber.value = regressionCurve;
        generateRegressionCurve();
    });

    inputKernelNumber.addEventListener('input', function () {
        regressionCurve = parseFloat(inputKernelNumber.value);
        inputKernelRange.value = regressionCurve;
        generateRegressionCurve();
    });
});
