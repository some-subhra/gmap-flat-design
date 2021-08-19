const locationList = [
  { "latlng": [22.6757521, 88.0495333], name: "Kolkata", address: "Kolkata, West Bengal" },
  { "latlng": [28.6923329, 76.9512639], name: "Delhi", address: "Delhi, India" },
  { "latlng": [12.95396, 77.4908522], name: "Bangalore", address: "Bangaluru, Karnataka, India" }
];

const initPosition = { lat: 22.7239117, lng: 75.7237633 };
let infoWindow, map, geocoder;

/*
 * Inital callback function which is called on load. This will Initialize map, geocoder, defining map configs
 * Calling create Marker function for predefined list
 */
function initMap() {
  const initConfig = {
    zoom: 4,
    center: initPosition
  }
  map = new google.maps.Map(document.getElementById('map'), initConfig);
  map.setMapTypeId(google.maps.MapTypeId.ROADMAP); //ROADMAP/SATELLITE/HYBRID/TERRAIN

  geocoder = new google.maps.Geocoder();
  registerMapEvents();
  locationList.forEach(list => {
    const latlng = new google.maps.LatLng(...list.latlng);
    createMarker(map, latlng, list);
  })
}

/*
 * Create Marker
 * @param {...} map - map object created using new google.maps.Map(targetElement,config)
 * @param {lat: number, lng: number} latlng - Coordinates object
 * @param {latlng, name, address} list - Predefined List to set custom properties of marker like title, location and address
 */
function createMarker(map, latlng, list) {

  const marker = new google.maps.Marker({
    position: latlng,
    map: map,
    animation: google.maps.Animation.DROP, // DROP, BOUNCE
    title: list?.name || latlng.toString(),
    address: list?.address || '',
    location: '',
    icon: list ? '' : { url: 'asset/custom-location.svg' }
  });
  marker.location = marker.getPosition().toString().replace(/[()]/g, '');

  if (infoWindow) {
    infoWindow.close();
  }

  if (!list) {
    geocodePosition(marker);
  } else {
    registerMarkerEvents(marker);
  }

  removeListSelection();
}

/*
 * Doing Reverse Geocoding - Fetching address details using marker position 
 * @param {...} marker - marker object created using new google.maps.Marker(props)
 */
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

/*
* Updating Marker Address based on address fetched from geocodePosition 
* @param {...} marker - marker object created using new google.maps.Marker(props)
* @param string address - comma separated string fetched from geocodePosition response 
*/
function updateMarkerAddress(marker, address) {
  if (address) {
    const splittedAddress = address.split(',');
    marker.title = splittedAddress[0];
    marker.address = address;
  }
  registerMarkerEvents(marker, true);
}

/*
 * Registering Map events
 */
function registerMapEvents() {

  infoWindow = new google.maps.InfoWindow();

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

  google.maps.event.addListener(map, 'center_changed', () => {
    if ($('.reset').hasClass('hidden')) {
      $('.reset').removeClass('hidden');
      $('.reset').addClass('shown');
    }
  });

  google.maps.event.addListener(map, 'click', event => {
    createMarker(map, event.latLng);
  });

  google.maps.event.addListener(infoWindow, "closeclick", () => {
    reset();
  });
}

/*
 * Registering Marker events
 * @param {...} marker - marker object created using new google.maps.Marker(props)
 * @param boolean isCustomPin - true for custom created markers
 */
function registerMarkerEvents(marker, isCustomPin) {

  google.maps.event.addListener(marker, "click", () => {
    infoWindow.setContent(getInfoWindowContent(marker));
    infoWindow.open(map, marker);
    map.setZoom(7);
    map.setCenter(marker.getPosition());

    $("#marker_list li").filter((i, element) => {
      if ($('.loc').hasClass('active')) {
        removeListSelection();
      }
      return element.id === marker.location;
    }).addClass("active");

    const myElement = $("#marker_list li.active");
    const topPos = myElement.offset().top;
    $('.location-list')[0].scrollTop = topPos;
  });

  createMarkerList(marker, isCustomPin);
}

/*
 * Creating custom content for infoWindow
 * @param {...} marker - marker object created using new google.maps.Marker(props)
 */
function getInfoWindowContent(marker) {
  return `<b>${marker.title}</b><br>
  <P class='map-description'>
  <p class='clearfix'><span class='pull-left'><b>Address: </b></span><span class='pull-right'>${marker.address}</span></p>
  <p class='clearfix'><span class='pull-left'><b>Location: </b></span><span class='pull-right'>${marker.location}</span></p>`;
}

/*
 * Create Marker List outside map
 * @param {...} marker - marker object created using new google.maps.Marker(props)
 * @param boolean isCustomPin - true for custom created markers
 * 
 */
function createMarkerList(marker, isCustomPin) {

  const ul = document.getElementById("marker_list");
  const li = document.createElement("li");
  li.id = marker.getPosition().toString().replace(/[()]/g, '');
  $(li).addClass(isCustomPin ? 'loc custom' : 'loc');
  li.innerHTML = marker.title;
  const cross = document.createElement("i");
  $(cross).addClass('material-icons cross-icon');
  cross.innerHTML = 'close'
  cross.addEventListener('click', (event) => {
    marker.setMap(null);
    event.currentTarget.parentNode.remove();
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
  })
  li.appendChild(cross);
  ul.appendChild(li);

  google.maps.event.addDomListener(li, "click", function () {
    show = this;
    if ($('.loc').hasClass('active')) {
      removeListSelection();
    }
    $(show).addClass('active');
    google.maps.event.trigger(marker, "click");
  });

  const isMarkerExists = locationList.some(location => {
    location.latlng.toString() === marker.location;
  })

  if (!isMarkerExists) {
    locationList.push(
      { "latlng": [], name: marker.title },
    )
  }
}


/*
 * Remove selected state from marker list
 */
function removeListSelection() {
  $('.loc').removeClass('active');
}

/*
 * Reset map to initial state
 */
function reset() {
  infoWindow.close();
  map.setZoom(4);
  map.setCenter(initPosition);
  $('.reset').removeClass('shown');
  $('.reset').addClass('hidden');
  removeListSelection();
}