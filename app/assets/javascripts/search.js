Data = {

  keys: 0,

  parseResults: function(data) {
    var d = data;
    var key_arr = [];
    _.each(d, function(val, key) {
      alert(key);
      if (key === "trait_name") {
        key_arr.push(val.toLowerCase());
      }
    });
    Data.keys = _.uniq(key_arr).length;
  },

  numKeys: function(data) {
  }

};

$(function () {

  if (Data.keys > 0) {
    var width = 400,
      height = 400,
      radius = Math.min(width, height) / 2,
      data = d3.range(10).map(Math.random).sort(d3.descending),
      color = d3.scale.category20(),
      arc = d3.svg.arc().outerRadius(radius),
      donut = d3.layout.pie();

    var vis = d3.select("#search-results").append("svg")
      .data([data])
      .attr("width", width)
      .attr("height", height);

    var arcs = vis.selectAll("g.arc")
      .data(donut)
      .enter().append("g")
      .attr("class", "arc")
      .attr("transform", "translate(" + radius + "," + radius + ")");

    var paths = arcs.append("path")
      .attr("fill", function(d, i) { return color(i); });

    paths.transition()
      .ease("bounce")
      .duration(2000)
      .attrTween("d", tweenPie);

    function tweenPie(b) {
      b.innerRadius = 0;
      var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
      return function(t) {
        return arc(i(t));
      };
    }
  }
});
