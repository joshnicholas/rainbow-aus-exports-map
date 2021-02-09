// if you want to import a module from shared/js then you can
// just do e.g. import Scatter from "shared/js/scatter.js"
var d3 = require("d3");

//Guardian-specific responsive iframe function

iframeMessenger.enableAutoResize();

function makeMap(data1, data15, data2) {

	centroids = data15.features;

	countries = topojson.feature(data2, data2.objects.countries);

	var isMobile;
	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	if (windowWidth < 610) {
			isMobile = true;
	}	

	if (windowWidth >= 610){
			isMobile = false;
	}

	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var height = width*0.4;					
	var margin = {top: 0, right: 0, bottom: 0, left:0};

	width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;
   
	projection = d3.geoMercator()
                .center([0,0])
                .scale(width * 0.15)
                .rotate([-100,0])
				.translate([width/2,height/2]); 
				
	path = d3.geoPath(projection);

	color = d3.scaleSequential()
    .domain(d3.extent(Array.from(data1.values())))
    .interpolator(d3.interpolateYlGnBu)
    .unknown("#ccc");

	var data = []  

	var keys = Object.keys(data1[0])
	keys = keys.splice(1,4)

	function drawCurve(context, source, target) {
		var midPoint = [(source[0] + target[0])/2, (source[1] + target[1])/2]
		var midPoints = getCirclePoints(midPoint[0],midPoint[1], target[0], target[1], 30)
		context.moveTo(source[0], source[1])
		context.quadraticCurveTo(midPoints.leftX, midPoints.leftY, target[0], target[1])
		return context
	  }

	arcTotalWidth = d3.scaleLinear()
  	.range([1,30])
	.domain([1,98944990]);

	arcWidth = d3.scaleLog()
		.range([1,10])		
		.domain([1,100000000]);
	  
	getCirclePoints = function(x1,y1,x2,y2,r) {
		var startAngle = Math.atan2(y2- y1, x2-x1) * 180 / Math.PI
		var angRight = (startAngle + 90 > 360) ? (startAngle + 90 - 360) : (startAngle + 90)
		var angLeft = (startAngle - 90 < 0) ? 360 - (90 - startAngle) : (startAngle - 90)
		var rightX = x1 + r * Math.cos(angRight * 0.0174532925)
		var rightY = y1 + r * Math.sin(angRight * 0.0174532925)
		var leftX = x1 + r * Math.cos(angLeft * 0.0174532925)
		var leftY = y1 + r * Math.sin(angLeft * 0.0174532925)
		return {"rightX": rightX, "rightY": rightY, "leftX":leftX, "leftY":leftY}
	  }

	getLinePoints = function(x1,y1,x2,y2,r) {
		var startAngle = Math.atan2(y2- y1, x2-x1)
		var pointX = x1 + r * Math.cos(startAngle)
		var pointY = y1 + r * Math.sin(startAngle)
		return [pointX,pointY]
	}

	colors = d3.scaleOrdinal()
	.range(['#fb8072', '#999999', '#00bfff','#66c2a5','#fc8d62','#8da0cb','#9970ab', '#e78ac3'])
	.domain(keys)

	data1.forEach(d => {
		var newRow = {}
		var source = centroids.find(c => c.properties.COUNTRY == "Australia").geometry.coordinates
		console.log(d.Country)
		var target = centroids.find(c => c.properties.COUNTRY == d.Country).geometry.coordinates
		newRow['targetName'] = d.Country
		
		newRow['sourceName'] = "Australia"
		newRow['exports'] = []
		newRow['source'] = source
		newRow['target'] = target
		var posCounter = 0
		var totalCounter = 0
		keys.forEach(key => {
			totalCounter = totalCounter + +d[key]
			// console.log(+d[key])
			// console.log(totalCounter)
		})
		
		newRow['total'] = totalCounter
		
		keys.forEach(key => {
			var width = (+d[key]/newRow['total']) * arcTotalWidth(newRow['total'])
			// console.log(width)
			var position = posCounter + width/2 
			totalCounter = totalCounter + +d[key]
			newRow['exports'].push({"category": key, "value": +d[key], "position":position, "width":width})
			posCounter = posCounter + width
		})
		
		newRow['sourcePoints'] = getCirclePoints(
			projection(newRow.source)[0],
			projection(newRow.source)[1],
			projection(newRow.target)[0],
			projection(newRow.target)[1],
			arcTotalWidth(newRow['total'])/2
		)
		newRow['targetPoints'] = getCirclePoints(
			projection(newRow.target)[0],
			projection(newRow.target)[1],
			projection(newRow.source)[0],
			projection(newRow.source)[1],
			arcTotalWidth(newRow['total'])/2
		)
		
		newRow['exports'].forEach(e => {
			e.source = getLinePoints(
			newRow['sourcePoints'].leftX,
			newRow['sourcePoints'].leftY,
			newRow['sourcePoints'].rightX,
			newRow['sourcePoints'].rightY,
			e.position
			)
			
			e.target = getLinePoints(
			newRow['targetPoints'].rightX,
			newRow['targetPoints'].rightY,
			newRow['targetPoints'].leftX,
			newRow['targetPoints'].leftY,
			e.position
			)
		})
		data.push(newRow)
		})

		
		var nodeData = []
		var totals = []
		var uniques = new Set()
		data.forEach(d => {
			var newRow = {}
			if (!uniques.has(d.targetName)) {
			newRow['nodeName'] = d.targetName
			newRow['location'] = d.target
			newRow['total'] = d.total
			totals.push(d.total)
			uniques.add(d.targetName)
			nodeData.push(newRow)
			}
			
		})

		data.forEach(d => {
			var newRow = {}
			if (!uniques.has(d.sourceName)) {
			newRow['nodeName'] = d.sourceName
			newRow['location'] = d.source
			newRow['total'] = d3.max(totals)
			uniques.add(d.sourceName)
			nodeData.push(newRow)
		  }
		})

		var nodes = nodeData;

		shortNodes = nodes.filter(d => (d.total >= 4534984));



	d3.select("#graphicContainer svg").remove();

	var svg = d3.select("#graphicContainer").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");					

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const g= svg.append("g");

	g.append("g")
	.selectAll("path")
	.data(countries.features)
	.enter()
	.append("path")
	.attr("fill", "lightgrey")
	.attr("d", path)
	.attr("title", d => d.properties.NAME_LONG);

	g.append("path")
	.datum(topojson.mesh(data2, data2.objects.countries, (a, b) => a !== b))
	.attr("fill", "none")
	.attr("stroke", "white")
	.attr("stroke-linejoin", "round")
	.attr('d', path)

	var arcs = g.append("g")
	.attr("class", "arcs")
	.selectAll("g")
	.data(data)
	.enter()
	.append("g")

	var exports = []
	
	data.forEach(function(d) {exports.push(d.exports)});
	// data.forEach(function(d) {console.log(d.target)});

	var curves = arcs.selectAll(".curve")
	.data(d => d.exports)
	.enter()
	.append("path")
	.attr("d", d => drawCurve(d3.path(), d.source, d.target))
	.style("stroke", d => colors(d.category))
	.style("fill", "none")
	.style("stroke-width", d => d.width)
	.style("opacity","70%")

	var nodes = g.append("g")
    .attr("class", "nodes")
		.selectAll("g")
		  .data(nodes)
		  .enter().append("g")
	
	var nodeCircles = nodes.append("circle")
		.attr("cx",d => projection(d.location)[0])
		.attr("cy",d => projection(d.location)[1])
		.attr("r", d => arcTotalWidth(d.total))
		.attr("fill","white")
		.attr("stroke", "black") 

} 

var q = Promise.all([d3.csv("exports@3.csv"),
					d3.json("https://raw.githubusercontent.com/gavinr/world-countries-centroids/master/dist/countries.geojson"),
					d3.json("countries@1.json")])

					.then(([exports, centroids, countries]) => {
						
						makeMap(exports, centroids, countries)
						var to=null
						var lastWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
						window.addEventListener('resize', function() {
							var thisWidth = document.querySelector("#graphicContainer").getBoundingClientRect()
							if (lastWidth != thisWidth) {
								window.clearTimeout(to);
								to = window.setTimeout(function() {

										makeMap(exports, centroids, countries)

									}, 500)
				}
			})
        });

        