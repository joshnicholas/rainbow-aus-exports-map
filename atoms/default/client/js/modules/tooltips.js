import * as d3 from "d3"
import { numberFormat } from './numberFormat'

function makeTooltip(el, data) {

	// console.log("make", el)


	var els = d3.selectAll(el)
	var width = document.querySelector("#graphicContainer").getBoundingClientRect().width
	var tooltip = d3.select("#graphicContainer").append("div")
		    .attr("class", "tooltip")
		    .attr("id", "tooltip")
		    .style("position", "absolute")
		    .style("background-color", "white")
		    .style("opacity", 0);

	els.on("mouseover.tooltip", function(d, i) {
		var country = i.nodeName;
		var country_array = data.find(d => d.nodeName == country)

		var text = ""
		if (i.nodeName == "Australia"){
			text += `<b>${i.nodeName} exports:</b>			
			<br>Total: ${numberFormat(i.total)} USD`
			console.log(country_array)
		} else { 
			text += `<b>${i.nodeName} imports:</b>`
			country_array.imports.forEach(function(d){
				if (+d.value > 0){
			text += `<br>${d.category}: ${numberFormat(d.value)} USD`
				}
			})
			// var text = `<b>Country: ${i.nodeName}<br>Total Imported: ${numberFormat(i.total)}</b>`
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