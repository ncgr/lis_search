LisSearch.soybasesController = Ember.ResourceController.create({
  resourceType: LisSearch.Soybase,

  formatLinkageGroup: function(data) {
    var lg = [];
    var g = _.groupBy(data, function(d) { return d.map[0].linkage_group; });
    _.each(g, function(v, k) {
      lg.push({
        "name": k,
        "size": v.length
      });
    });

    return lg;
  },

  formatData: function(data) {
    var self = this;

    var formatted = {
      "name": "QTLs",
      "children": []
    };

    groups = _.groupBy(data, function(g) {
      return g.trait_name.toLowerCase().underscore();
    });

    _.each(groups, function(v, k) {
     formatted["children"].push({
       "name": k,
       "children": self.formatLinkageGroup(v)
     });
    });

    return formatted;
  },

  graph: function() {
    var data = this.get('content');

    var groups =  _.groupBy(data, function(s) {
      return s.trait_name.toLowerCase();
    });

    var slices = [];
    _.each(groups, function(g) {
      slices.push(g.length);
    });

    var sliceNames = _.map(_.keys(groups), function(k) {
      if (k === "" || k === undefined || k === null) {
        k = "unknown";
      }
      return k;
    });

    var total = _.reduce(slices, function(memo, num) { return memo + num; }, 0);

    var width = 400,
      height = 400,
      outerRadius = Math.min(width, height) / 2,
      innerRadius = outerRadius * 0.4,
      data = slices,
      color = d3.scale.category20(),
      arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius),
      donut = d3.layout.pie();

    var vis = d3.select("#search-results").append("div")
      .attr("class", "results")
      //.attr("title", "Click to remove")
      //.on("click", function() { $(this).slideUp('slow'); })
      .append("svg")
      .attr("class", "graph")
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

    var legend = d3.select(".results:last-child").append("svg")
      .attr("class", "legend")
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

  }.property('graph'),

  icicle: function() {

    var groups = this.formatData(this.get('content'));

    var width = 800,
      height = 250;

    var x = d3.scale.linear()
      .range([0, width]);

    var y = d3.scale.linear()
      .range([0, height]);

    var color = d3.scale.category20c();

    var vis = d3.select(".results:last-child").append("svg")
      .attr("width", width)
      .attr("height", height);

    var partition = d3.layout.partition()
      .value(function(d) { return d.size; });

    var rect = vis.data([groups]).selectAll("rect")
      .data(partition.nodes)
      .enter().append("rect")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .attr("width", function(d) { return x(d.dx); })
      .attr("height", function(d) { return y(d.dy); })
      .attr("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .on("click", function(d) {
        x.domain([d.x, d.x + d.dx]);
        y.domain([d.y, 1]).range([d.y ? 20 : 0, height]);

        rect.transition()
        .duration(750)
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y); })
        .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
        .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
      });

  }.property('icicle')
});
