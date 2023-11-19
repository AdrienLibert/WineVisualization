(function() {
    // Initialisation des variables de taille des colonnes et de la courbe de régression
    let columnSize = 1;
    let regressionCurve = 1;

    // Récupération des éléments du DOM pour les curseurs et les champs numériques
    const inputColRange = document.getElementById("columnSizeInput");
    const inputColNumber = document.getElementById("columnSizeNumber");
    const inputKernelRange = document.getElementById("regressionCurveInput");
    const inputKernelNumber = document.getElementById("regressionCurveNumber");
    const dataVariableSelect = document.getElementById("dataVariable");

    // Déclaration des variables pour le graphique D3
    let svg, xScaleLinear, yScaleLinear, colorScaleLinear, xAxis, qualityData;
    let width_graph, height_graph, max, min, format;

    // Fonctions utilitaires
    function gaussian(x_, mean, sigma) {
        var gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
        var x = (x_ - mean) / sigma;
        return gaussianConstant * Math.exp(-.5 * x * x) / sigma;
    }

    function getLength(data) {
        return data.length;
    }

    // Fonction pour mettre à jour l'histogramme
    function updateBarHistogram(columnsSize) {
        let numberOfBins = Math.round(Math.min(50, 20 / columnsSize));
        let datagram = d3.histogram().thresholds(xScaleLinear.ticks(numberOfBins))(qualityData);

        let max_y = d3.max(datagram, d => d.length);
        yScaleLinear.domain([0, max_y]);

        svg.selectAll(".bar").remove();
        let bar = svg.selectAll(".bar").data(datagram).enter().append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(${xScaleLinear(d.x0)}, ${yScaleLinear(d.length)})`);

        bar.append("rect")
            .attr("x", 1)
            .attr("width", d => Math.max(0, xScaleLinear(d.x1) - xScaleLinear(d.x0) - 1))
            .attr("height", d => height_graph - yScaleLinear(d.length))
            .attr("fill", d => colorScaleLinear(d.length));

        bar.append("text")
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
        svg.selectAll(".regressionCurve").remove();

        for (let d_x = 0; d_x <= width_graph; d_x += 1) {
            let dx_value = 0;
            for (let v = 0; v < qualityData.length; v += 1) {
                dx_value += gaussian(d_x / width_graph * (max - min) + min, qualityData[v], regressionKernelSize);
            }
            regressionPoint.push([d_x / width_graph * (max - min) + min, dx_value]);
        }

        let yRegression = d3.scaleLinear().domain([0, Math.max(...regressionPoint.map(value => value[1]))]).range([height_graph, 0]);
        let curveGenerator = d3.line().x(d => xScaleLinear(d[0])).y(d => yRegression(d[1])).curve(d3.curveBasis);

        svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("class", "regressionCurve")
            .attr("d", curveGenerator(regressionPoint));
    }

    // Gestionnaire de mise à jour de l'histogramme en fonction des sélections
    function updateHistogramFromSelection(selectedData) {
        if (selectedData.length === 0) {
            qualityData = data.map(d => d[dataVariableSelect.value]);
        } else {
            qualityData = selectedData.map(d => d[dataVariableSelect.value]);
        }
        max = d3.max(qualityData);
        min = d3.min(qualityData);
        xScaleLinear.domain([min, max]);
        updateBarHistogram(columnSize);
        generateRegressionCurve(regressionCurve);
    }
    

    // Mise à jour des données et des graphiques lors du changement de variable
    function updateDataAndGraphs() {
        let selectedVariable = dataVariableSelect.value;
        qualityData = data.map(d => d[selectedVariable]);
        max = d3.max(qualityData);
        min = d3.min(qualityData);
        xScaleLinear.domain([min, max]);
        updateBarHistogram(columnSize);
        generateRegressionCurve(regressionCurve);
    }

    // Configuration initiale
    window.addEventListener('load', function() {
        qualityData = data.map(d => d["total sulfur dioxide"]);
        format = d3.format(",.0f");
        const margin_graph = { top: 30, right: 30, bottom: 30, left: 30 };
        width_graph = 1850 - margin_graph.left - margin_graph.right;
        height_graph = 900 - margin_graph.top - margin_graph.bottom;
        max = d3.max(qualityData);
        min = d3.min(qualityData);

        xScaleLinear = d3.scaleLinear().domain([min, max]).range([0, width_graph]);
        yScaleLinear = d3.scaleLinear().domain([0, max]).range([height_graph, 0]);
        colorScaleLinear = d3.scaleLinear().domain([0, max]).range(["orange", "red"]);
        xAxis = d3.axisBottom(xScaleLinear);

        svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width_graph + margin_graph.left + margin_graph.right)
            .attr("height", height_graph + margin_graph.top + margin_graph.bottom)
            .append("g")
            .attr("transform", `translate(${margin_graph.left}, ${margin_graph.top})`);

        generateRegressionCurve(regressionCurve); // Appel de la fonction après l'initialisation de svg
    });

    // Gestionnaires d'événements pour les interactions de l'utilisateur
    inputColRange.addEventListener('change', function() {
        columnSize = parseFloat(inputColRange.value);
        inputColNumber.value = columnSize;
        updateBarHistogram(columnSize);
    });

    inputColNumber.addEventListener('change', function() {
        columnSize = parseFloat(inputColNumber.value);
        inputColRange.value = columnSize;
        updateBarHistogram(columnSize);
    });

    inputKernelRange.addEventListener('change', function() {
        regressionCurve = parseFloat(inputKernelRange.value);
        inputKernelNumber.value = regressionCurve;
        generateRegressionCurve(regressionCurve);
    });

    inputKernelNumber.addEventListener('change', function() {
        regressionCurve = parseFloat(inputKernelNumber.value);
        inputKernelRange.value = regressionCurve;
        generateRegressionCurve(regressionCurve);
    });

    dataVariableSelect.addEventListener('change', updateDataAndGraphs);

    document.addEventListener('scatterSelectionChanged', function(e) {
        updateHistogramFromSelection(e.detail);
    });

    document.addEventListener('parallelSelectionChanged', function(e) {
        updateHistogramFromSelection(e.detail);
    });
    
})();
