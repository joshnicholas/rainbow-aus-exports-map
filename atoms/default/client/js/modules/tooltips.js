import * as d3 from "d3"

function makeTooltip(el, data) {

	console.log("make", el)


	var els = d3.selectAll(el)
	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var tooltip = d3.select("#graphicContainer").append("div")
		    .attr("class", "tooltip")
		    .attr("id", "tooltip")
		    .style("position", "absolute")
		    .style("background-color", "white")
		    .style("opacity", 0);

	els.on("mouseover.tooltip", function(d, i) {
		console.log(i)
		if (i.nodeName == "Australia"){
			var text = `<b>Country: ${i.nodeName}<br>Total exported: ${i.total}</b>`
		} else {
			var text = `<b>Country: ${i.nodeName}<br>Total Imported: ${i.total}</b>`
		}
		tooltip.transition()
			.duration(200)
		   	.style("opacity", .9);

		tooltip.html(text)
		var tipHeight = document.querySelector("#tooltip").getBoundingClientRect().height
		var tipWidth = document.querySelector("#tooltip").getBoundingClientRect().width
		// console.log(tipHeight)
		var mouseX = d3.pointer(d)[0]
        var mouseY = d3.pointer(d)[1]

		console.log(mouseX)
		console.log(mouseY)
        var half = width/2;

        if (mouseX < half) {
            tooltip.style("left", (d3.pointer(d)[0]) + 10 + "px");
        }

        else if (mouseX >= half) {
            tooltip.style("left", (d3.pointer(d)[0] - tipWidth) + "px");
        }

        // tooltip.style("left", (d3.pointer(d)[0] + tipWidth/2) + "px");
        tooltip.style("top", (d3.pointer(d)[1]) + "px");

	})
	
	els.on("mouseout", function(d) {

	  tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);

	})


}

export { makeTooltip }