LisSearch.SearchSoybasesView = Ember.View.extend({
  tagName:      'form',
  templateName: 'ember/templates/soybases/search',

  init: function() {
    this._super();
    this.set('soybase', LisSearch.Soybase.create());
  },

  submit: function(event) {
    var self    = this;
    var soybase = this.get('soybase');

    event.preventDefault();

    $.ajax({
      type: 'GET',
      url: soybase.resourceUrl,
      data: "q=" + soybase.q,
    }).fail(function(e) {
      alert(e);
    }).done(function(data) {
      LisSearch.soybasesController.clearAll();
      LisSearch.soybasesController.loadAll(data);
    });
  }
});
