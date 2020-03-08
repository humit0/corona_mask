(function() {
  function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
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
  window.addEventListener("load", function() {
    // 구매 가능 조건 출력
    var can_buy = document.getElementById("can_buy");
    var day = new Date().getDay();
    var buyer;
    if (1 <= day && day <= 5) {
      buyer = "XXX" + day + "년생과 XXX" + ((day + 5) % 10) + "년생의";
    } else {
      buyer = "모두";
    }
    can_buy.innerText = "오늘은 " + buyer + " 구입 가능합니다.";

    // 이전에 지연 동의를 했는지 확인
    if (getCookie("agree") !== "1") {
      // 사용자 지연 동의 여부 확인
      var ok = confirm(
        "제공되는 정보는 5분 이상 지연된 데이터입니다. 이에 동의하시겠습니까?"
      );
      if (ok) {
        setCookie("agree", 1, 365);
      } else {
        // 동의하지 않은 경우 사용이 불가하다고 알림
        alert("동의를 하지 않아 해당 서비스 사용이 불가합니다.");
        return;
      }
    }

    // 하단에 반경 버튼 추가 및 이벤트 등록
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

    // 지도 상에서 움직이는 이벤트 감지
    naver.maps.Event.addListener(
      map,
      "center_changed",
      _.debounce(moveCenter, 100)
    );

    // geolocation으로 사용자의 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
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
})();
