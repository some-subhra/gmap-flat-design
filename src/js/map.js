
// user defined/ pre-defined list
const locationList = [
  { "latlng": [22.6757521,88.0495333], name: "Kolkata", address: "Kolkata, West Bengal", icon: 'asset/lion-logo.png'  },
  { "latlng": [28.6923329,76.9512639], name: "Delhi", address: "Delhi, India", icon: 'https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png' },
  { "latlng": [12.95396,77.4908522], name: "Bangalore", address: "Bangaluru, Karnataka, India"}
];

// map load position
const initPosition = { lat: 22.7239117, lng: 75.7237633 };
let infoWindow, map, geocoder;

function initMap() {

  // to load the map with initial config
  const initConfig = {
    zoom: 4,
    center: initPosition // user defined
  }

  // create map object
  map = new google.maps.Map(document.getElementById('map'), initConfig);
  map.setMapTypeId(google.maps.MapTypeId.ROADMAP); //roadmap/satellite/hybrid/terrain

  // grocoder object for reverse geo-coding
  geocoder = new google.maps.Geocoder();

  // ---different way to create the same ----
  // initPos = new google.maps.LatLng(25.304303764403617, 87.47314453125);
  // var mapDiv = document.getElementById("map");
  // map = new google.maps.Map(mapDiv);
  // map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
  // map.setCenter(initPos);
  // map.setZoom(6);


  // create custom markers for pre-defined list
  locationList.forEach(list => {
    const latlng = new google.maps.LatLng(...list.latlng); // creates and object like this { lat: 42.7762, lng: -71.0773 }, same type of object can be passed via the pre-defined list
    createMarker(map, latlng, list);
  })

  //listen for zoom change
  google.maps.event.addListener(map, "zoom_changed", () => {
    if (map.getZoom() != 6) {
      if ($('.reset').hasClass('hidden')) {
        $('.reset').removeClass('hidden');
        $('.reset').addClass('shown');
      }
    }
    else {
      if ($('.reset').hasClass('shown')) {
        $('.reset').removeClass('shown');
        $('.reset').addClass('hidden');

      }
    }
  });

  // listen for drag on the map
  google.maps.event.addListener(map, 'center_changed', () => {
    if ($('.reset').hasClass('hidden')) {
      $('.reset').removeClass('hidden');
      $('.reset').addClass('shown');
    }
  });

  // listen for click event on the map
  google.maps.event.addListener(map, 'click', event => {
    createMarker(map, event.latLng);
  });

}

function createMarker(map, latlng, list) {

  //Creates a marker
  const marker = new google.maps.Marker({
    position: latlng,
    map: map,
    animation: list ? google.maps.Animation.BOUNCE : google.maps.Animation.DROP, // DROP, BOUNCE
    title: list?.name || latlng.toString(),
    address: list?.address || '',
    location: '',
    // district: list?.district,
    // state: list?.state,
    // country: list?.country || 'India',
    icon:''
  });
  if (list?.icon) {
    marker.icon = { url: list?.icon } // custom image
  }
  marker.location = marker.getPosition().toString().replace(/[()]/g, '');

  // close any opened infoWindow
  if (infoWindow) {
    infoWindow.close();
  }

  if (!list) { // do reverse geo-coding and fetch details only on newly created markers
    geocodePosition(marker);
  } else {
    registerEvents(marker);
  }

  removeListSelection();
}

function geocodePosition(marker) {
  geocoder.geocode({
    latLng: marker.getPosition()
  }, function (responses) {
    if (responses && responses.length > 0) {
      console.log(responses[0]);
      updateMarkerAddress(marker, responses[0].formatted_address);
    } else {
      updateMarkerAddress(marker, '');
    }
  });
}

function updateMarkerAddress(marker, address) {
  if (address) {
    const splittedAddress = address.split(',');
    marker.title = splittedAddress[0];
    marker.address = address;
    // marker.state = splittedAddress[1] || '';
    // marker.district = splittedAddress[2] || '';
    // marker.country = splittedAddress[3] || 'India';
  }
  registerEvents(marker);
}

function registerEvents(marker) {

  // infowindow is there to show more details
  infoWindow = new google.maps.InfoWindow(
    //  { content: getInfoWindowContent(marker) } // info window content can be set if dynamic
  );

  // different way to set content inside info window
  // infoWnd.setContent("<b class='highlight1'>" + marker.title + "</b><br>" +
  // "<img src='" + src + "' class='map-image img-responsive' width='150' height='100' alt='" + marker.title + "'>" +
  // "<P class='map-description'>" +
  // "<p class='clearfix'><span class='pull-left'><b>Region:</b></span><span class='pull-right'>" + district + "</span></p>" +
  // "<p class='clearfix'><span class='pull-left'><b>State:</b></span><span class='pull-right'>" + state + "</span></p>" +
  // "<a target='_blank' href='" + url + "'><p class='read-button highlight3 uper'>Get Info &nbsp;<span class='glyphicon glyphicon glyphicon-share-alt'></span></p></a>");

  // action on the marker
  google.maps.event.addListener(marker, "click", () => {
    // open info window on marker action
    infoWindow.setContent(getInfoWindowContent(marker));
    infoWindow.open(map, marker);
    // map.setZoom(4); // focus on the area
    // setTimeout(() => {
    map.setZoom(7); // focus on the area
    map.setCenter(marker.getPosition()); // centre the info window
    // },600);


    // highlight selected location on list
    $("#marker_list li").filter((i, element) => {
      if ($('.loc').hasClass('active')) {
        removeListSelection();
      }
      return element.id === marker.location;
    }).addClass("active");
  });

  // reset map on closing info window
  google.maps.event.addListener(infoWindow, "closeclick", () => {
    reset();
  });

  // create the list to be displayed for selection/de-selection
  createMarkerList(marker);
}

function getInfoWindowContent(marker) {
  return `<b>${marker.title}</b><br>
  <P class='map-description'>
  <p class='clearfix'><span class='pull-left'><b>Address: </b></span><span class='pull-right'>${marker.address}</span></p>
  <p class='clearfix'><span class='pull-left'><b>Location: </b></span><span class='pull-right'>${marker.location}</span></p>`;
}

function reset() {
  infoWindow.close();
  map.setZoom(4);
  map.setCenter(initPosition);
  $('.reset').removeClass('shown');
  $('.reset').addClass('hidden');
  removeListSelection();
}

function createMarkerList(marker) {
  //Creates a sidebar button
  const ul = document.getElementById("marker_list");
  const li = document.createElement("li");
  li.id = marker.getPosition().toString().replace(/[()]/g, '');
  $(li).addClass('loc');
  li.innerHTML = marker.title;
  ul.appendChild(li);

  //placing the Reset button at last  
  const last = $('#marker_list').children().last();
  const resetButton = $('.reset');
  $(resetButton).insertAfter(last);

  //Trigger a click event to marker when the button is clicked.
  google.maps.event.addDomListener(li, "click", function () {
    show = this;
    if ($('.loc').hasClass('active')) {
      removeListSelection();
    }
    $(show).addClass('active');
    google.maps.event.trigger(marker, "click");
  });

  //add newly created marker in the location list
  const isMarkerExists = locationList.some(location => {
    location.latlng.toString() === marker.location;
  })

  if (!isMarkerExists) {
    locationList.push(
      { "latlng": [], name: marker.title },
    )
  }
}

function removeListSelection() {
  $('.loc').removeClass('active');
}





