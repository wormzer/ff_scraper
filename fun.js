Teams = new Mongo.Collection('teams');

if (Meteor.isClient) {
  Template.matchup.helpers({
    mattsStarters: function () {
      return Teams.findOne({_id: "Matt"}).starters;
    },

    billsStarters: function () {
      return Teams.findOne({_id: "Bill"}).starters;
    }
  });
}

if (Meteor.isServer) {
	var Cheerio = Meteor.npmRequire('cheerio');
	var Request = Meteor.npmRequire('request');
	var Fiber = Meteor.npmRequire('fibers');

  Meteor.startup(function () {
		Meteor.call('pollFleaFlicker');
		Meteor.setInterval(function() { Meteor.call('pollFleaFlicker'); }, 10000) 
	});
	
	Meteor.methods({
		'pollFleaFlicker': function() {
			console.log("Updating...")
			url = "http://www.fleaflicker.com/nfl/leagues/158476/scores/30778006";
			Request(url, function(error, response, html) {
				Fiber(function() {
					// First we'll check to make sure no errors occurred when making the request

					if(!error) {
						// Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
						var $ = Cheerio.load(html);

						function scrapePlayer(owner, fleaflickerIndex) {
							var teamData = {
								starters: []
							};

							for (i = 0; i < 8; i++) {
								var row_id = '#row_' + fleaflickerIndex + '_0_' + i;

								teamData['starters'].push( {
									name: $('.col-md-6 ' + row_id + ' .player').text(),
									position: $('.col-md-6 ' + row_id + ' .position').text(),
									fantasyPoints: $('.col-md-6 ' + row_id + ' td').eq(6).text()
								} )
							}
							Teams.upsert({_id: owner}, {$set: teamData});
						}

						scrapePlayer("Bill", 0);
						scrapePlayer("Matt", 1);
					}
				}).run();
				console.log("Done.")
			});
		}
	});
}
