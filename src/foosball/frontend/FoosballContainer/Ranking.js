import React, { Component } from "react";
import "./Ranking.scss";

import { debounce } from "lodash";

import { select } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";

class Ranking extends Component {
  constructor(props) {
    super(props);

    this.canvas = React.createRef();

    this.state = {
      boundingRect: {},
      loaded: false
    };
  }

  componentDidMount() {
    this.handleCanvasResize();
    this.debouncedResize = debounce(this.handleCanvasResize, 100);
    window.addEventListener("resize", this.debouncedResize, false);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const nextRect = nextState.boundingRect;
    const didSvgSizeChange =
      this.state.boundingRect.width !== nextRect.width ||
      this.state.boundingRect.height !== nextRect.height;

    if (didSvgSizeChange) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    if (this.state.loaded) {
      this.createChart();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.debouncedResize, false);
  }

  handleCanvasResize = () => {
    const boundingRect = this.canvas.current.getBoundingClientRect();
    this.setState({ boundingRect, loaded: true });
  };

  createChart = () => {
    this.cleanOldSvg();
    const width = this.state.boundingRect.width;
    const height = this.props.users.length * 50;
    const margin = { left: 80, right: 0, top: 0, bottom: 0 };

    const data = this.props.users.sort((a, b) => {
      return b.current_rating - a.current_rating;
    });

    const xMax = Math.max(...data.map(player => player.current_rating));
    const textYDistanceDown = 25;

    var svg = select(".canvas")
      .append("svg")
      .attr("viewBox", [0, 0, width, height]);

    // Create the svg:defs element and the main gradient definition.
    var svgDefs = svg.append("defs");

    var blueGradient = svgDefs
      .append("linearGradient")
      .attr("id", "blueGradient");

    blueGradient
      .append("stop")
      .attr("class", "blue-stop-left")
      .attr("offset", "0");

    blueGradient
      .append("stop")
      .attr("class", "white-stop-right")
      .attr("offset", "1");

    var greenGradient = svgDefs
      .append("linearGradient")
      .attr("id", "greenGradient");

    greenGradient
      .append("stop")
      .attr("class", "blue-green-stop-left")
      .attr("offset", "0");

    greenGradient
      .append("stop")
      .attr("class", "green-stop-right")
      .attr("offset", "1");

    var xScale = scaleLinear()
      .domain([0, xMax])
      .range([0, width - margin.left - margin.right]);
    var yScale = scaleBand()
      .domain(data.map(player => player.id))
      .rangeRound([0, height - margin.top - margin.bottom])
      .paddingInner(0.35)
      .paddingOuter(0.25);
    const valueScaleShiftRight = 135;
    var xValueScale = scaleLinear()
      .domain([0, xMax])
      .range([0, width - margin.left - margin.right - valueScaleShiftRight]);

    var yAxis = svg
      .append("g")
      .attr("transform", d => `translate(${0},${margin.top})`);
    yAxis
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(14,${yScale(d.id)})`)
      .append("text")
      .attr("y", textYDistanceDown + 8)
      .append("tspan")
      .text((d, i) => i + 1)
      .style("fill", "#ffffff")
      .style("font-size", "42");

    var graph = svg
      .append("g")
      .attr("transform", d => `translate(${margin.left},${margin.top})`);
    var cell = graph
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(${0},${yScale(d.id)})`);

    var playerRect = cell
      .append("rect")
      .classed("blue-gradient", true)
      .attr("width", d => xScale(xMax))
      .attr("height", yScale.bandwidth());

    var playerCircle = cell
      .append("circle")
      .style("fill", "white")
      .attr("cx", d => xScale(0))
      .attr("cy", yScale.bandwidth() / 2)
      .attr("r", yScale.bandwidth() / 2 + 6);

    var playerSymbol = cell
      .append("g")
      .attr("transform", d => `translate(0,-6)`);

    playerSymbol
      .append("circle")
      .style("stroke", "grey")
      .style("stroke-width", "3")
      .style("fill", "white")
      .attr("cx", d => xScale(0))
      .attr("cy", yScale.bandwidth() / 2)
      .attr("r", yScale.bandwidth() / 7);

    playerSymbol
      .append("path")
      .attr("d", `M -10 28 V 33 H 10 V 28 C 10 23, -10 23, -10 28`)
      .style("stroke", "grey")
      .style("stroke-width", "3")
      .style("fill", "white");

    var playerTitleGroup = cell
      .append("g")
      .attr("transform", d => `translate(28,${textYDistanceDown})`);
    playerTitleGroup
      .append("text")
      .append("tspan")
      .attr("y", -(250 / yScale.bandwidth()))
      .text(d => d.first_name)
      .style("font-size", "18");
    playerTitleGroup
      .append("text")
      .append("tspan")
      .attr("y", 180 / yScale.bandwidth())
      .attr("x", 15)
      .text(d => d.last_name)
      .style("font-size", "14");

    var valueRects = cell
      .append("rect")
      .attr(
        "x",
        d => xValueScale(xMax - d.current_rating) + valueScaleShiftRight
      )
      .classed("green-gradient", true)
      .attr("width", d => xValueScale(d.current_rating))
      .attr("height", yScale.bandwidth());

    var valueCircle = cell
      .append("circle")
      .style("fill", "#21C8BE")
      .attr(
        "cx",
        d => xValueScale(xMax - d.current_rating) + valueScaleShiftRight + 4
      )
      .attr("cy", yScale.bandwidth() / 2)
      .attr("r", yScale.bandwidth() / 2);

    var valueTitleGroup = cell
      .append("g")
      .attr(
        "transform",
        d =>
          `translate(${xValueScale(xMax - d.current_rating) +
            valueScaleShiftRight -
            6},${textYDistanceDown - 4})`
      );
    valueTitleGroup
      .append("text")
      .append("tspan")
      .text(d => Math.round(d.current_rating))
      .style("font-size", "10");
  };

  cleanOldSvg = () => {
    select(".canvas")
      .selectAll("svg")
      .remove();
  };

  render() {
    return (
      <div className="ranking-container">
        <div>Foosball Ranking</div>
        <div className="canvas" ref={this.canvas}></div>
      </div>
    );
  }
}

export default Ranking;
