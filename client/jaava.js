var mymap;

function addPlace() {
    var lon = document.getElementById("lon").value;
    var lat = document.getElementById("lat").value;
    var info = document.getElementById("description").value;
    var location = {
                    type:"Point", 
                    coordinates:[parseFloat(lon), 
                                parseFloat(lat)]
                    };
    var query =
      `mutation add($info: String!,$location:GeoLocationInput!){
            add(record:{
                info:$info,
                location:$location
            }){record {
                info
                location{
                    coordinates
                }
            }}
        }`;
    fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
            info, 
            location
            }
        })
    })
    .then(r => r.json())
    .then(data => console.log('data returned:', data));
}

function find(){
    var lon = document.getElementById("slon").value;
    var lat = document.getElementById("slat").value;
    var distance2 = parseFloat(document.getElementById("distance").value); 
    var distance = distance2*970.0/496.0; // kalibrointi maps.google:lla
    var location = [parseFloat(lon), 
                    parseFloat(lat)]
        
    var query =
      `query find($location: [Float]!,$distance:Float!){
            find(location: $location, distance: $distance){
                info
                location{
                    coordinates
                }
            }
        }`;
    fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
                location, 
                distance
            }
        })
    })
    .then(r => r.json())
    .then(data => {
        console.log('data returned:', data);
        
        if(mymap){
            mymap.off();
            mymap.remove();
        }

        mymap = L.map('mapid').setView(location, 16);
        
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoianVoYWoiLCJhIjoiY2p0c3oxZ25vMDN0bjN6cXRrNjY3Z2V6ZSJ9.l1NTr4WZ_8JpbbqNiSNTkw', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 25,
            id: 'mapbox.streets',
            accessToken: 'pk.eyJ1IjoianVoYWoiLCJhIjoiY2p0c3oxZ25vMDN0bjN6cXRrNjY3Z2V6ZSJ9.l1NTr4WZ_8JpbbqNiSNTkw'
        }).addTo(mymap);

        for(var i = 0; i < data.data.find.length; i++){
            var marker = new L.CircleMarker([data.data.find[i].location.coordinates[0],
                data.data.find[i].location.coordinates[1]],{radius:9,color:"red"})
                .addTo(mymap);
            marker.bindTooltip(data.data.find[i].info, 
            {
                permanent: true, 
                direction: 'right',
                className: 'tooltipClass'
            });
        }
        L.marker(location).addTo(mymap).bindPopup('You');
    });//testpoint:   60.24   24.88
}