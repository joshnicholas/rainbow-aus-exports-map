import * as topojson from "topojson"
import * as d3 from "d3"
import { makeTooltip } from './modules/tooltips'
var target = "#graphicContainer";

function makeMap(data1, data2, data3) {

	/// Insert chart title, standfirst, source etc.

	d3.select("#chartTitle").text("Top ten destinations for Australia's main exports")

	d3.select("#subTitle").text("China is the dominant market for Australia's major exports")

	d3.select("#sourceText").text("| Guardian analysis of CEPI's BACI dataset")

	var new_centroids = data3.features

	var commodities = data1.columns.filter(d => d != "Country");

	var max_val = d3.max(data1.map(d => +d["Iron ore"]))
	console.log(max_val)

	var countries = topojson.feature(data2, data2.objects.countries);

	var isMobile;
	var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

	if (windowWidth < 610) {
			isMobile = true;
	}	

	if (windowWidth >= 610){
			isMobile = false;
	}

	var width = document.querySelector(target).getBoundingClientRect().width
	var height = width*0.45;					
	var margin = {top: 10, right: 10, bottom: 10, left:10};

	width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;
   
	var projection = d3.geoMercator()
                .center([0,20])
                .scale(width * 0.15)
                .rotate([-145,0])
				.translate([width/2,height/2]); 
				
	var path = d3.geoPath(projection);

	var color = d3.scaleSequential()
    .domain(d3.extent(Array.from(data1.values())))
    .interpolator(d3.interpolateYlGnBu)
    .unknown("#ccc");

	var data = []  

	var keys = commodities

	function drawCurve(context, source, target) {
		var midPoint = [(source[0] + target[0])/2, (source[1] + target[1])/2]
		var midPoints = getCirclePoints(midPoint[0],midPoint[1], target[0], target[1], 30)
		context.moveTo(source[0], source[1])
		context.quadraticCurveTo(midPoints.leftX, midPoints.leftY, target[0], target[1])
		return context
	  }

	var arcTotalWidth = d3.scaleLinear()
  	.range([1,30])
	.domain([1,71000000000]);

	var arcWidth = d3.scaleLog()
		.range([1,10])		
		.domain([1,max_val]);
	  
	var getCirclePoints = function(x1,y1,x2,y2,r) {
		var startAngle = Math.atan2(y2- y1, x2-x1) * 180 / Math.PI
		var angRight = (startAngle + 90 > 360) ? (startAngle + 90 - 360) : (startAngle + 90)
		var angLeft = (startAngle - 90 < 0) ? 360 - (90 - startAngle) : (startAngle - 90)
		var rightX = x1 + r * Math.cos(angRight * 0.0174532925)
		var rightY = y1 + r * Math.sin(angRight * 0.0174532925)
		var leftX = x1 + r * Math.cos(angLeft * 0.0174532925)
		var leftY = y1 + r * Math.sin(angLeft * 0.0174532925)
		return {"rightX": rightX, "rightY": rightY, "leftX":leftX, "leftY":leftY}
	  }

	var getLinePoints = function(x1,y1,x2,y2,r) {
		var startAngle = Math.atan2(y2- y1, x2-x1)
		var pointX = x1 + r * Math.cos(startAngle)
		var pointY = y1 + r * Math.sin(startAngle)
		return [pointX,pointY]
	}

	var colors = d3.scaleOrdinal()
	.range(['#d10a10', '#0099db', '#4f524a','#de007e','#ffe500',' #b29163','#9970ab', '#bbce00', "#ea5a0b"])
	.domain(keys)

	data1.forEach(d => {
		var newRow = {}
		var source = new_centroids.find(c => c.properties.name_long == "Australia").geometry.coordinates
		// console.log(d.Country)
		var target = new_centroids.find(c => c.properties.name_long == d.Country).geometry.coordinates
		newRow['targetName'] = d.Country
		
		newRow['sourceName'] = "Australia"
		newRow['exports'] = []
		newRow['source'] = source
		newRow['target'] = target
		var posCounter = 0
		var totalCounter = 0
		keys.forEach(key => {
			totalCounter = totalCounter + +d[key]
		})
		
		newRow['total'] = totalCounter
		
		keys.forEach(key => {
			var width = (+d[key]/newRow['total']) * arcTotalWidth(newRow['total'])
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
			newRow['total'] = d3.sum(totals)
			uniques.add(d.sourceName)
			nodeData.push(newRow)
		  }
		})

		// var nodes = nodeData;

	var shortNodes = nodeData.filter(d => (d.total > 1));
	var country_array = shortNodes.map(d => d.nodeName)

	d3.select("#graphicContainer svg").remove();

	var svg = d3.select(target).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("id", "svg")
				.attr("overflow", "hidden");					

	var features = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const g= features.append("g");

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

	var curves = arcs.selectAll(".curve")
	.data(d => d.exports)
	.enter()
	.append("path")
	.attr("class", "curves")
	.attr("d", d => drawCurve(d3.path(), d.source, d.target))
	.style("stroke", d => colors(d.category))
	.style("fill", "none")
	.style("stroke-width", d => d.width)
	.style("opacity","60%")


	var nodes = g.append("g")
    .attr("class", "nodes")
		.selectAll("g")
		  .data(shortNodes)
		  .enter().append("g")
		  .attr("class", "node")


	makeTooltip(".node", shortNodes);	
	
	var nodeCircles = nodes.append("circle")
		.attr("cx",d => projection(d.location)[0])
		.attr("cy",d => projection(d.location)[1])
		.attr("r", function(d){
			if (d.nodeName == "Australia"){
				// var oz_total = (d.total / country_array.length)
				var oz_total = (d.total / 10)
				return arcTotalWidth(oz_total)
			} else {
				return arcTotalWidth(d.total)
			}
		})
		.attr("Country", d => d.nodeName)
		.attr("Total", d => d.total)
		.attr("fill","white")
		.attr("stroke", "black") 

	var size = 10;

	var legend = features.append("svg")
	.attr("class", "legend")
	// .attr("transform", "translate(" + width*0.60 + "," + height*0.25 + ")")
	// .attr("transform", "translate(" + margin.left + "," + (height - 150) + ")")
	.attr("transform", "translate(" + margin.left + "," + 0 + ")")
	.style("font-size", "12px");

	legend.selectAll("dots")
	.data(keys)
	.enter()
	.append("rect")
	.attr("y", 5)
    .attr("x", function(d,i){ return 20 + i*(size+40)})
    // .attr("x", 100)
    // .attr("y", function(d,i){ return 100 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
    .attr("width", size)
    .attr("height", size)
    .style("fill", function(d){ return colors(d)})


	legend.selectAll("dotLabels")
	.data(keys)
	.enter()
	.append("text")
	.attr("y", 5 + size*2)
	.attr("x", function(d,i){ return 20 + i*(size+40)}) 
	//   .attr("x", 100 + size*1.2)
	//   .attr("y", function(d,i){ return 100 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
	//   .style("fill", function(d){ return colors(d)})
	.style("fill", "#000000")
	  .text(function(d){ return d})
	  .attr("text-anchor", "left")
	  .style("alignment-baseline", "middle")




	

} 

var q = Promise.all([d3.csv("<%= path %>/exports@3.csv"),
					d3.json("<%= path %>/countries@1.json"),
					d3.json("<%= path %>/country_centroids_az8.json")])

					.then(([exports, countries, new_centroids]) => {
						
						makeMap(exports, countries, new_centroids)
						var to=null
						var lastWidth = document.querySelector(target).getBoundingClientRect()
						window.addEventListener('resize', function() {
							var thisWidth = document.querySelector(target).getBoundingClientRect()
							if (lastWidth != thisWidth) {
								window.clearTimeout(to);
								to = window.setTimeout(function() {

										makeMap(exports, countries, new_centroids)

									}, 500)
				}
			})
        });

        