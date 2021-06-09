var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 1500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left").ticks(3),
    background,
    foreground;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("cars.csv", function(error, cars) {

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {
    return d != "name" && d != "type" && d != "color" && (y[d] = d3.scale.linear()
        .domain([0,1])
        .range([height, 0]));
  }));
  
  var user = [] 
  var parties = []
  var coalitions = []
  
  cars.forEach(function(d, i){
    if(d["type"] == "u"){
      user.push(d);
    } else if(d["type"] == "p"){
      parties.push(d);
    } else {
      coalitions.push(d);
    }
  })

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(user)
    .enter().append("path")
      .attr("d", path)
    .each(function(d, i){
      d3.select(this).style("stroke", d.color);
  });
  

  // Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(parties)
    .enter().append("path")
      .attr("d", path)
  .each(function(d, i){
      d3.select(this).style("stroke", d.color);
  });
  
  coalition = svg.append("g")
      .attr("class", "coalition")
    .selectAll("path")
      .data(coalitions)
    .enter().append("path")
      .attr("d", path)
  .each(function(d, i){
      d3.select(this).style("stroke", d.color);
  });

  // Add a group element for each dimension.
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return {x: x(d)}; })
        .on("dragstart", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { return position(a) - position(b); });
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("dragend", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
        }));

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
  
  d3.selectAll("input[name='toggle']").on("change", function(){
    focus(this.value);
  });
  
  d3.selectAll("input[name='hide']").on("change", function(){
    focusIndividual(this.value, this.checked);
  });
  
  function focus(code){
    background.style("opacity", function(o) {
          return code != 1 && code != 0 ? 0 : 1;
        });
    foreground.style("opacity", function(o) {
          return code != 2 && code != 0 ? 0 : 1;
        });
    coalition.style("opacity", function(o) {
          return code != 3 && code != 0 ? 0 : 1;
        });
  }
  
  function focusIndividual(code, check){
    background.each(function(d){
      if(d.name == code){
        if(check == false){
          d3.select(this).style("opacity", 0);
        } else {
          d3.select(this).style("opacity", 1);
        }
      }
    });
    foreground.each(function(d){
      if(d.name == code){
        if(check == false){
          d3.select(this).style("opacity", 0);
        } else {
          d3.select(this).style("opacity", 1);
        }
      }
    });
    coalition.each(function(d){
      if(d.name == code){
        if(check == false){
          d3.select(this).style("opacity", 0);
        } else {
          d3.select(this).style("opacity", 1);
        }
      }
    });
  }
  
});

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}