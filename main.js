'use strict';
import * as lib from "./lib.mjs"

const main = async (params) => {
	let [grouped_cable, raw_cable] = await lib.fetchData();
	let [outerContainer, plotContainer] = lib.makeContainer(params);
	let [xScale, yScale] = lib.makeScales(raw_cable, params);
	lib.addAxes(plotContainer, xScale, yScale, params);
	lib.makeLines(plotContainer, xScale, yScale, grouped_cable, params);
    window.box_mgr = new lib.BoxManager(outerContainer, plotContainer, xScale, yScale, params);
    lib.addButtons(box_mgr);
    box_mgr.setState("CREATE")
}

const params = {
	marginX: 125,
	marginY: 75,
	width: 800,
	height: 300
};

main(params)