var lat = 37.4501089;
var lng = 126.9528387;
var radius = 500;
var loc = new naver.maps.LatLng(lat, lng);
var map = new naver.maps.Map("map", {
  center: loc,
  zoom: 15
});
var red_marker = {
  content: '<img src="img/sold-out.png">',
  size: {
    width: 30,
    height: 30
  }
};

var blue_marker = {
  content: '<img src="img/in-stock.png">',
  size: {
    width: 30,
    height: 30
  }
};
var circle = new naver.maps.Circle({
  map: map,
  center: loc,
  radius: radius,
  strokeColor: "#3cc79e",
  strokeOpacity: 0.7,
  storkeWeight: 1,
  fillColor: "#fff498",
  fillOpacity: 0.5
});

var xhr = new XMLHttpRequest();
var markers = [];
xhr.onreadystatechange = function() {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      markers.map(function(marker) {
        marker[0].setMap(null);
        marker[1].setMap(null);
      });
      markers = JSON.parse(xhr.responseText).stores.map(function(item) {
        var marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(item.lat, item.lng),
          map: map,
          icon: item.sold_out ? red_marker : blue_marker
        });
        var stock_t = item.stock_t.split(":");
        var content = [
          '<div class="info_box ' +
            (item.sold_out ? "sold_out" : "in_stock") +
            '">',
          "  <h3>" + item.name + "</h3>",
          '  <p class="addr">' + item.addr + "</p>",
          "  <p>재고: " +
            item.remain_cnt +
            "/" +
            item.stock_cnt +
            " | " +
            stock_t[0] +
            "시 " +
            stock_t[1] +
            "분 입고</p>",
          "</div>"
        ].join("");

        var infobox = new naver.maps.InfoWindow({
          content: content,
          maxWidth: 280,
          pixelOffset: new naver.maps.Point(0, -20),
          disableAutoPan: true
        });
        naver.maps.Event.addListener(marker, "click", function(e) {
          if (infobox.getMap()) infobox.close();
          else infobox.open(map, marker);
        });
        return [marker, infobox];
      });
    } else {
      alert("데이터 가져오기 에러");
    }
  }
};
function moveCenter(center) {
  var lat = center["_lat"],
    lng = center["_lng"];
  xhr.open(
    "GET",
    "https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByGeo/json?lat=" +
      lat +
      "&lng=" +
      lng +
      "&m=" +
      radius
  );
  xhr.send();

  circle.setCenter(center);
}
function changeRadius(r) {
  radius = parseInt(r);
  circle.setRadius(radius);
  var center = map.getCenter();
  moveCenter(center);
}
naver.maps.Event.once(map, "init_stylemap", function() {
  var locationBtnHtml = [
    '<div class="dist_ctl">',
    '<input type="button" class="btn" val="200" value="200m">',
    '<input type="button" class="btn" val="500" value="500m">',
    '<input type="button" class="btn" val="1000" value="1km">',
    "</div>"
  ].join("");
  var customControl = new naver.maps.CustomControl(locationBtnHtml, {
    position: naver.maps.Position.BOTTOM_CENTER
  });

  customControl.setMap(map);
  var ctrls = customControl.getElement().firstChild.children;
  Array.prototype.slice.call(ctrls).map(function(ctrl) {
    naver.maps.Event.addDOMListener(ctrl, "click", function() {
      var rad = ctrl.getAttribute("val");
      changeRadius(rad);
    });
  });
});
naver.maps.Event.addListener(
  map,
  "center_changed",
  _.debounce(moveCenter, 100)
);
window.addEventListener("load", function() {
  var can_buy = document.getElementById("can_buy");
  var day = new Date().getDay();
  var buyer;
  if (1 <= day && day <= 5) {
    buyer = "XXX" + day + "년생과 XXX" + ((day + 5) % 10) + "년생의";
  } else {
    buyer = "모두";
  }
  can_buy.innerText = "오늘은 " + buyer + " 구입 가능합니다.";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        console.log(position);
        loc = new naver.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        map.setCenter(loc);
      },
      function() {
        console.log("failed to get location");
        moveCenter(loc);
      }
    );
  } else {
    moveCenter(loc);
  }
});
