LisSearch.soybasesController = Ember.ResourceController.create({
  resourceType: LisSearch.Soybase,

  clearGraph: function() {
    $("#search-results").empty();
  },

  graph: function() {
    this.clearGraph();
    var data = this.get('content');
    var groups =  _.groupBy(data, function(s) {
      return s.trait_name.toLowerCase();
    });
    var slices = [];
    _.each(groups, function(g) {
      slices.push(g.length);
    });

    var sliceNames = _.keys(groups);
    var total = _.reduce(slices, function(memo, num) { return memo + num; }, 0);

    var width = 400,
      height = 400,
      outerRadius = Math.min(width, height) / 2,
      innerRadius = outerRadius * 0.4,
      data = slices,
      color = d3.scale.category20(),
      arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius),
      donut = d3.layout.pie();

    var vis = d3.select("#search-results").append("svg")
      .data([data])
      .attr("width", width)
      .attr("height", height);

    var arcs = vis.selectAll("g.arc")
      .data(donut)
      .enter().append("g")
      .attr("class", "arc")
      .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    var center = vis.append("svg:g")
      .attr("class", "center")
      .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

    var totalLabel = center.append("svg:text")
      .attr("class", "total-label")
      .attr("dy", -5)
      .attr("text-anchor", "middle")
      .text("Total QTLs");

    var totalValue = center.append("svg:text")
      .attr("class", "total")
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .text(total);

    var paths = arcs.append("path")
      .attr("fill", function(d, i) { return color(i); })
      .attr("d", arc);

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

    var legend = d3.select("#search-results").append("div")
      .attr("id", "legend")
      .append("svg")
      .data([data])
      .attr("width", 325);

    for(var i = 0; i < sliceNames.length; i++) {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", function(d, k) { return color(i) });
      legend.append("text")
        .attr("class", "label")
        .attr("x", 20)
        .attr("y", function(d, k) { return 10 + (i * 20) })
        .text(function(d, k) { return sliceNames[i]; });
    }

  }.property('graph')
});
