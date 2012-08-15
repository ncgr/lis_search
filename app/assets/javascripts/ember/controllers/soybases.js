LisSearch.soybasesController = Ember.ResourceController.create({
  resourceType: LisSearch.Soybase,

  emptyResults: function(name) {
    d3.select("#results-empty").append("div")
      .attr("class", "empty")
      .append("span")
      .attr("class", "total-label")
      .text("Your search returned 0 QTLs for " + name);

    $(".empty").fadeOut(5000);
  },

  color: d3.scale.category20(),

  pie: function() {
    var self = this;

    var data = self.get('content');

    _.each(data, function(v, k) {
      _.each(v, function(val, key) {

        if (_.keys(val).length === 0) {
          return self.emptyResults(key);
        }

        var groups =  _.groupBy(val, function(s) {
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

        var width = 300,
            height = 300,
            outerRadius = Math.min(width, height) / 2,
            innerRadius = outerRadius * 0.4,
            data = slices,
            arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius),
            donut = d3.layout.pie();

        var vis = d3.select("#search-results").append("div")
          .attr("class", "results")
          .append("svg")
          .attr("class", "pie")
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
          .text(key + " QTLs");

        var totalValue = center.append("svg:text")
          .attr("class", "total")
          .attr("dy", 25)
          .attr("text-anchor", "middle")
          .text(total);

        var paths = arcs.append("path")
          .attr("fill", function(d, i) { return self.color(i); })
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
          .attr("class", "pie-legend")
          .data([data])
          .attr("width", 325);

        for(var i = 0; i < sliceNames.length; i++) {
          legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", function(d, k) { return self.color(i) });
          legend.append("text")
            .attr("class", "label")
            .attr("x", 20)
            .attr("y", function(d, k) { return 10 + (i * 20) })
            .text(function(d, k) { return sliceNames[i]; });
        }

      });
    });

  }.property('pie'),

  formatIcicleLinkageGroup: function(data) {
    var lg = [];
    var g = _.groupBy(data, function(d) { return d.lg; });
    _.each(g, function(v, k) {
      lg.push({
        "name": k,
        "size": v.length
      });
    });

    return lg;
  },

  formatIcicleSpecies: function(data) {
    var self = this,
      formatted = [];

    var species = _.groupBy(data, 'species');

    _.each(species, function(v, k) {
      formatted.push({
        "name": k,
        "children": self.formatIcicleLinkageGroup(v)
      });
    });

    return formatted;
  },

  formatIcicleData: function(data) {
    var self = this,
        results = [],
        groups;

    var formatted = {
      "name": "QTLs",
      "children": []
    };

    _.each(data, function(v, k) {
      _.each(v, function(val, key) {
        if (_.keys(val).length > 0 ) {
          results.push(val);
        }
      });
    });

    results = _.flatten(results, true);

    groups = _.groupBy(results, function(g) {
      return g.trait_name.toLowerCase();
    });

    console.log(groups);

    _.each(groups, function(v, k) {
      formatted["children"].push({
        "name": k,
        "children": self.formatIcicleSpecies(v)
      });
    });

    return formatted;
  },


  icicle: function() {
    var self = this;

    var data = self.get('content');

    var groups = self.formatIcicleData(data);

    var width = 1100,
        height = 600,
        x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([0, height]);

    var vis = d3.select(".results:last-child").append("div")
      .attr("class", "icicle")
      .style("width", width + "px")
      .style("height", height + "px")
      .append("svg:svg")
      .attr("width", width)
      .attr("height", height);

    var partition = d3.layout.partition()
      .value(function(d) { return d.size; });

    var g = vis.selectAll("g")
      .data(partition.nodes(groups))
      .enter().append("svg:g")
      .attr("class", "icicle-node")
      .attr("transform", function(d) {
        return "translate(" + x(d.y) + "," + y(d.x) + ")";
      })
      .on("click", click);

    var kx = width / groups.dx,
        ky = height / 1;

    g.append("svg:rect")
      .attr("width", groups.dy * kx)
      .attr("height", function(d) { return d.dx * ky; })
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .on("click", function(d) { click(d); });

    g.append("svg:text")
      .attr("transform", function(d) { return "translate(8," + d.dx * ky / 2 + ")"; })
      .attr("dy", ".35em")
      .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
      .text(function(d) { return d.name === "" ? "unknown" : d.name.replace("_", " "); });

    var click = function(d) {
      if (!d.children) {
        return;
      }

      kx = (d.y ? width - 40 : width) / (1 - d.y);
      ky = height / d.dx;
      x.domain([d.y, 1]).range([d.y ? 40 : 0, width]);
      y.domain([d.x, d.x + d.dx]);

      var t = g.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

      t.select("rect")
        .attr("width", d.dy * kx)
        .attr("height", function(d) { return d.dx * ky; });

      t.select("text")
        .attr("transform", transform)
        .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });
    }

    var transform = function(d) {
      return "translate(8," + d.dx * ky / 2 + ")";
    }

  }.property('icicle'),

  formatGdData: function(data) {

    var trait_names = _.keys(_.groupBy(data, function(d) {
      return d.trait_name.toLowerCase() === "" ? "unknown" : d.trait_name.toLowerCase();
    }));

    var linkage_groups = _.keys(_.groupBy(data, function(d) { return d.lg; }));

    var obj = {};
    obj["trait_names"] = trait_names;
    obj["linkage_groups"] = linkage_groups;
    obj["values"] = [];

    _.each(data, function(d) {
      var values = {};
      values["trait_name"] = d.trait_name.toLowerCase() === "" ? "unknown" : d.trait_name.toLowerCase();
      _.each(linkage_groups, function(l) {
        if (d.lg === l) {
          values[l] = Math.abs(d.left_end - d.right_end);
        } else {
          values[l] = 0.0;
        }
      });
      obj["values"].push(values);
    });

    return obj;
  },

  genomicDistribution: function() {

    var self = this;

    var data = self.get('content');

    _.each(data, function(v, k) {
      _.each(v, function(val, key) {

        if (_.keys(val).length === 0) {
          return;
        }

        var maps = self.formatGdData(val);

        var size = 100,
        padding = 10,
        n = maps.linkage_groups.length;

        var x = {}, y = {};

        maps.linkage_groups.forEach(function(group) {
          var value = function(d) { return d[group] },
          domain = [d3.min(maps.values, value), d3.max(maps.values, value)],
          range = [padding / 2, size - padding / 2];

          x[group] = d3.scale.linear().domain(domain).range(range);
          y[group] = d3.scale.linear().domain(domain).range(range.reverse());
        });

        var brushstart = function(p) {
          if (brush.data !== p) {
            cell.call(brush.clear());
            brush.x(x[p.x]).y(y[p.y]).data = p;
          }
        }

        var brush = function(p) {
          var e = brush.extent();
          svg.selectAll("circle").attr("class", function(d) {
            return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
            && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
            ? d.trait_name : null;
          });
        }

        var brushend = function() {
          if (brush.empty()) {
            svg.selectAll("circle").attr("class", function(d) {
              return d.trait_name;
            });
          }
        }

        var cross = function(a, b) {
          var c = [],
              max = a.length,
              i = 0,
              j = 0,
              k = 0;
          for (i = 0; i < max; i += 1) {
            c.push({ x: a[i], i: k, y: b[i], j: j });
            k += 1;
            if (i > 0 && i % (padding - 1) === 0) {
              j += 1;
              k = 0;
            }
          }
          return c;
        }

        var axis = d3.svg.axis()
          .ticks(5)
          .tickSize(size * n);

        var brush = d3.svg.brush()
          .on("brushstart", brushstart)
          .on("brush", brush)
          .on("brushend", brushend);

        var svg = d3.select(".results:last-child").append("svg")
          .attr("class", "scatter")
          .attr("width", 1100)
          .attr("height", function() {
            var row = 0;
            for (var i = 0; i < (n / 9); i++) {
              row += 110;
            }
            return row;
          });

        var cell = svg.selectAll("g.cell")
          .data(cross(maps.linkage_groups, maps.linkage_groups))
          .enter().append("g")
          .attr("class", "cell")
          .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
          .each(function(p) {
            var cell = d3.select(this);

            cell.append("rect")
              .attr("class", "frame")
              .attr("x", padding / 2)
              .attr("y", padding / 2)
              .attr("width", size - padding)
              .attr("height", size - padding);

            cell.selectAll("circle")
              .data(maps.values)
              .enter().append("circle")
              .attr("fill", function(d) { return self.color(maps.trait_names.indexOf(d.trait_name)); })
              .attr("fill-opacity", ".5")
              .attr("class", function(d) { return d.trait_name; })
              .attr("cx", function(d) { return x[p.x](d[p.x]); })
              .attr("cy", function(d) { return y[p.y](d[p.y]); })
              .attr("r", function(d) {
                if (x[p.x](d[p.x]) === 5 || x[p.x](d[p.x]) === 95) {
                  return 0;
                }
                return 3;
              });

            cell.call(brush.x(x[p.x]).y(y[p.y]));
          });

        cell.append("text")
          .attr("x", padding)
          .attr("y", padding)
          .attr("dy", ".71em")
          .text(function(d) { return d.x; });

      });
    });

  }.property('genomicDistribution')
});
