LisSearch.soybasesController = Ember.ResourceController.create({
  resourceType: LisSearch.Soybase,

  graph: function() {
    var data = this.get('content');
    var groups =  _.groupBy(data, function(s) {
      return s.trait_name.toLowerCase();
    });
    var slices = [];
    _.each(groups, function(g) {
      slices.push(g.length);
    });

    var sliceNames = _.keys(groups);

    var width = 400,
      height = 400,
      radius = Math.min(width, height) / 2,
      data = slices,
      color = d3.scale.category20(),
      arc = d3.svg.arc().innerRadius(0).outerRadius(radius),
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
      .attr("fill", function(d, i) { return color(i); })
      .attr("d", arc);

    arcs.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("display", function(d) { return d.value > .15 ? null : "none"; })
      .text(function(d, i) { return sliceNames[i]; });

    paths.transition()
      .ease("bounce")
      .duration(2000)
      .attrTween("d", function(b) {
        b.innerRadius = 0;
        var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
        return function(t) {
          return arc(i(t));
        }
      });
  }.property('graph')
});
