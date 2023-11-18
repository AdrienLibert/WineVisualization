// Initialisation des variables de taille des colonnes et de la courbe de régression
let columnSize = 1;
let regressionCurve = 1;

// Récupération des éléments du DOM pour les curseurs et les champs numériques
const inputColRange = document.getElementById("columnSizeInput");
const inputColNumber = document.getElementById("columnSizeNumber");
const inputKernelRange = document.getElementById("regressionCurveInput");
const inputKernelNumber = document.getElementById("regressionCurveNumber");

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
function updateBarHistogram(columnsSize) {
    let numberOfBins = Math.round(Math.min(50, 20 / columnsSize)); // Limite à 50 bins maximum

    let datagram = d3.histogram().thresholds(xScaleLinear.ticks(numberOfBins))(qualityData);

    let max_y = d3.max(datagram, d => d.length);
    yScaleLinear.domain([0, max_y]);

    svg.selectAll(".bar").remove(); // Supprimer les anciennes barres

    let bar = svg.selectAll(".bar").data(datagram);

    // Création des nouvelles barres avec la taille de colonne mise à jour
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
function generateRegressionCurve(regressionKernelSize) {
    let regressionPoint = [];
    let curves = svg.selectAll(".regressionCurve");
    curves.remove();

    // Calcul des points de la courbe de régression
    for (let d_x = 0; d_x <= width_graph; d_x += 1) {
        let dx_value = 0;
        for (let v = 0; v < qualityData.length; v += 1) {
            dx_value += gaussian(d_x / width_graph * (max - min) + min, qualityData[v], regressionKernelSize);
        }
        regressionPoint.push([d_x / width_graph * (max - min) + min, dx_value]);
    }

    let regressionPointMax = Math.max(...regressionPoint.map(value => value[1]));
    let yRegression = d3.scaleLinear().domain([0, regressionPointMax]).range([height_graph, 0]);
    let curveGenerator = d3.line().x(d => xScaleLinear(d[0])).y(d => yRegression(d[1])).curve(d3.curveBasis);

    // Dessiner la courbe de régression
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("class", "regressionCurve")
        .attr("d", curveGenerator(regressionPoint));
}

// Configuration initiale lors du chargement de la fenêtre
window.addEventListener('load', function () {
    qualityData = data.map(function (d) { return d["total sulfur dioxide"]; });
    const color = "orange";
    format = d3.format(",.0f");
    const margin_graph = { top: 30, right: 30, bottom: 30, left: 30 };
    width_graph = 1850 - margin_graph.left - margin_graph.right;
    height_graph = 900 - margin_graph.top - margin_graph.bottom;
    max = d3.max(qualityData);
    min = d3.min(qualityData);

    xScaleLinear = d3.scaleLinear().domain([min, max]).range([0, width_graph]);
    const histogram = d3.histogram().thresholds(xScaleLinear.ticks(20))(qualityData);
    const max_y = d3.max(histogram, getLength);
    const min_y = d3.min(histogram, getLength);

    colorScaleLinear = d3.scaleLinear().domain([min_y, max_y]).range([d3.rgb(color).brighter(), d3.rgb(color).darker()]);
    yScaleLinear = d3.scaleLinear().domain([0, max_y]).range([height_graph, 0]);
    xAxis = d3.axisBottom(xScaleLinear);

    svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width_graph + margin_graph.left + margin_graph.right)
        .attr("height", height_graph + margin_graph.top + margin_graph.bottom)
        .append("g")
        .attr("transform", "translate(" + margin_graph.left + "," + margin_graph.top + ")");

    // Définir les valeurs initiales et générer le graphique
    inputColRange.value = columnSize;
    inputColNumber.value = columnSize;
    inputKernelRange.value = regressionCurve;
    inputKernelNumber.value = regressionCurve;

    generateRegressionCurve(regressionCurve);
});

// Gestionnaires d'événements pour les curseurs et les champs numériques
inputColRange.addEventListener('change', function () {
    let columnSizeValue = parseFloat(inputColRange.value);
    inputColNumber.value = columnSizeValue;
    updateBarHistogram(columnSizeValue);
});

inputColNumber.addEventListener('change', function () {
    inputColRange.value = inputColNumber.value;
    updateBarHistogram(inputColNumber.value);
})

inputKernelRange.addEventListener('change', function () {
    inputKernelNumber.value = inputKernelRange.value;
    generateRegressionCurve(inputKernelRange.value);
})

inputKernelNumber.addEventListener('change', function () {
    inputKernelRange.value = inputKernelNumber.value;
    generateRegressionCurve(inputKernelNumber.value);
})

// Récupération de l'élément de sélection du DOM
const dataVariableSelect = document.getElementById("dataVariable");

// Fonction pour mettre à jour les données et les graphiques
function updateDataAndGraphs() {
    let selectedVariable = dataVariableSelect.value;
    qualityData = data.map(d => d[selectedVariable]);
    max = d3.max(qualityData);
    min = d3.min(qualityData);
    xScaleLinear.domain([min, max]);

    updateBarHistogram(columnSize);
    generateRegressionCurve(regressionCurve);
}

// Gestionnaire d'événements pour la sélection de la variable
dataVariableSelect.addEventListener('change', updateDataAndGraphs);


