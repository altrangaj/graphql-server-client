const GCM = require('graphql-compose-mongoose');
const mongoose = require("mongoose");
const GC = require('graphql-compose');

// GeoJSON pätevä schema:
const GeoLocationSchema = new mongoose.Schema({
  type: {type:String, required: true},
  coordinates: {type:[Number], required: true}
});

var Point = mongoose.model("GeoLocation", GeoLocationSchema);
GCM.composeWithMongoose(Point, {});

// Varsinainen Type Composer schema syntyy tästä mongoose schemasta:
var PlaceSchema = new mongoose.Schema({
  info: {type:String, required: true},
  location: {type: GeoLocationSchema, required:true}
},
 { timestamps: true }
);

// gps-pallokoordinaatteihin perustuvaa hakua varten indeksi, mikä pitää herätellä init()-funktiolla
PlaceSchema.index({ location: "2dsphere" });
var Place = mongoose.model("Place", PlaceSchema);
const PlaceTC = GCM.composeWithMongoose(Place, {});

// Haku sijainnin ja etäisyyden perusteella ei taida löytyä valmiina graphql-compose-mongoose - paketista,
// joten lisätään custom-resolver hakua varten
PlaceTC.addResolver({
  name: 'find',
  kind: 'query',
  args: {
    location: '[Float]',
    distance: 'Float'
  },
  type: PlaceTC.getResolver('findMany').getType(),
  resolve: ({ _, args, context, info }) => {
    Place.init();                         // init(): pakko olla 2dsphere-indexiä varten, muuten tulee "index does't found" herjaa.
    var query = Place.find({              // Mongoose geospatial - henkinen haku.
      location: {                         // Tämä osaa hakea paikat, joiden sijainti
       $near: {                           // löytyy haulla.
        $maxDistance: args.distance,
        $geometry: {
         type: "Point",
         coordinates: [args.location[0], args.location[1]]
        }
       }
      }
     }).find((error, results) => {
      if (error) console.log(error);
        console.log(JSON.stringify(results, 0, 2));
     });
     return query.exec();                // näin tämä custom resolver saadaan syöttämään
                                         // paluuarvo samaan datavirtaan, kuin geneeriset
                                         // resolverit ja näin clientille saadaan haun tulos.
                                         // Pelkkä "return results;" ei toimi.
  }
});

// Itse taika tapahtuu addFields-metodein. Eli GraphQL resolverit syntyy näin:
GC.schemaComposer.Query.addFields({
  count: PlaceTC.getResolver('count'),
  find: PlaceTC.getResolver('find') // jotta custom resolveri saataisiin näkyväksi,
                                    // joudutaan siitä ilmoittamaan tässä
});

 // Tässä syntyy GraphQL resolver paikan lisäämistä varten. Kaikki CRUD-metodit
 // löytyvät määritellyille mongoose-schemoille ja muutakin. Tässä on käytetty 'createOne'-keywordia
 // luomaan lisäysproseduuri yhdelle paikalle.
GC.schemaComposer.Mutation.addFields({
  add: PlaceTC.getResolver('createOne'),
});

const graphqlSchema = GC.schemaComposer.buildSchema();
module.exports = graphqlSchema;