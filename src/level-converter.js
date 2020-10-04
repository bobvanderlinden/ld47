const { parse } = require("svg-parser");
const fs = require("fs");
const { join } = require("path");
const svgpath = require("svgpath");
const content = fs.readFileSync(join(__dirname, "level.svg"), "utf-8");
const root = parse(content);
const svg = root.children[0];
console.log(svg.children);

function getLayer(id) {
  return svg.children.filter((child) => child.properties.id === id)[0];
}

const mapLayer = getLayer("map");
const paths = mapLayer.children.filter((child) => child.tagName === "path");

const polygons = [];
for (const path of paths) {
  const points = [];
  svgpath(path.properties.d).iterate((segment, index, x, y) => {
    console.log(segment, index, x, y);
    if (segment[0] === "M") {
      return;
    }
    points.push([Math.round(x), Math.round(y)]);
  });
  polygons.push(points);
}

const checkpoints = [];
const checkpointsLayer = getLayer("checkpoints");
for (const checkpoint of checkpointsLayer.children.sort(
  (checkpoint) => checkpoint.properties.id
)) {
  checkpoints.push([
    Math.round(parseFloat(checkpoint.properties["sodipodi:cx"])),
    Math.round(parseFloat(checkpoint.properties["sodipodi:cy"])),
  ]);
}

const level = {
  polygons,
  checkpoints,
};

fs.writeFileSync(join(__dirname, "level.json"), JSON.stringify(level));
