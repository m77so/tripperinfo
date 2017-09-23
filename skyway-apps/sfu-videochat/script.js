/* eslint-disable require-jsdoc */
$(function() {
  // GPS
  // Geolocation APIに対応している
  if (navigator.geolocation) {
    alert("この端末では位置情報が取得できます");
    // Geolocation APIに対応していない
  } else {
    alert("この端末では位置情報が取得できません");
  }
  let lat = 0;
  let lng = 0;
  let moyori_i = -1
  const stations = [
    ["東京", 35.681382, 139.76608399999998],
    ["有楽町", 35.675069, 139.763328],
    ["新橋", 35.665498, 139.75964],
    ["浜松町", 35.655646, 139.756749],
    ["田町", 35.645736, 139.74757499999998],
    ["品川", 35.630152, 139.74044000000004],
    ["大崎", 35.6197, 139.72855300000003],
    ["五反田", 35.626446, 139.72344399999997],
    ["目黒", 35.633998, 139.715828],
    ["恵比寿", 35.64669, 139.710106],
    ["渋谷", 35.658517, 139.70133399999997],
    ["原宿", 35.670168, 139.70268699999997],
    ["代々木", 35.683061, 139.702042],
    ["新宿", 35.690921, 139.70025799999996],
    ["新大久保", 35.701306, 139.70004399999993],
    ["高田馬場", 35.712285, 139.70378200000005],
    ["目白", 35.721204, 139.706587],
    ["池袋", 35.728926, 139.71038],
    ["大塚", 35.731401, 139.72866199999999],
    ["巣鴨", 35.733492, 139.73934499999996],
    ["駒込", 35.736489, 139.74687500000005],
    ["田端", 35.738062, 139.76085999999998],
    ["西日暮里", 35.732135, 139.76678700000002],
    ["日暮里", 35.727772, 139.770987],
    ["鶯谷", 35.720495, 139.77883700000007],
    ["上野", 35.713768, 139.77725399999997],
    ["御徒町", 35.707438, 139.774632],
    ["秋葉原", 35.698683, 139.77421900000002],
    ["神田", 35.69169, 139.77088300000003]
  ];

  stations.forEach((v,i)=>{
    $("#information_centers").append(`<option id="${i}" value="${i}">${v[0]}</option>`)
  })
  $("#information_centers").change(function(){
    console.log($(this).val())
    moyori_i = ~~($(this).val())
  })
  const  getDistance=function(lat1, lng1, lat2, lng2) {
    
           function radians(deg){
              return deg * Math.PI / 180;
           }
           console.log([lat1, lng1, lat2, lng2])
    
           return 6378.14 * Math.acos(Math.cos(radians(lat1))* 
            Math.cos(radians(lat2))*
            Math.cos(radians(lng2)-radians(lng1))+
            Math.sin(radians(lat1))*
            Math.sin(radians(lat2)));
        }
  const getPos =     // 現在地取得処理
  function() {
    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      // 取得成功した場合
      function(position) {
        console.log(
          "緯度:" + position.coords.latitude + ",経度" + position.coords.longitude
        );
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        let dists = stations.map(s=>getDistance(lat,lng,s[1],s[2]))
        let dist = dists.reduce((a,b)=>a>b?b:a,999999989999)
        moyori_i = dists.indexOf(dist)
        $("#text-location").text(stations[moyori_i][0])
      },
      // 取得失敗した場合
      function(error) {
        switch (error.code) {
          case 1: //PERMISSION_DENIED
            alert("位置情報の利用が許可されていません");
            break;
          case 2: //POSITION_UNAVAILABLE
            alert("現在位置が取得できませんでした");
            break;
          case 3: //TIMEOUT
            alert("タイムアウトになりました");
            break;
          default:
            alert("その他のエラー(エラーコード:" + error.code + ")");
            break;
        }
      }
    );
  };
  getPos()
        setInterval(getPos(),60);

  // Peer object
  const peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3
  });

  let localStream;
  let room;
  peer.on("open", () => {
    $("#my-id").text(peer.id);
    // Get things started
    step1();
  });

  peer.on("error", err => {
    alert(err.message);
    // Return to step 2 if error occurs
    step2();
  });

  $("#make-call").on("submit", e => {
    e.preventDefault();
    // Initiate a call!
    //const roomName = $("#join-room").val();
    const roomName = moyori_i
    if (!roomName) {
      return;
    }
    room = peer.joinRoom("sfu_video_" + roomName, {
      mode: "sfu",
      stream: localStream
    });

    $("#room-id").text(roomName);
    step3(room);
  });

  $("#end-call").on("click", () => {
    room.close();
    step2();
  });

  // Retry if getUserMedia fails
  $("#step1-retry").on("click", () => {
    $("#step1-error").hide();
    step1();
  });

  // set up audio and video input selectors
  const audioSelect = $("#audioSource");
  const videoSelect = $("#videoSource");
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
    const values = selectors.map(select => select.val() || "");
    selectors.forEach(select => {
      const children = select.children(":first");
      while (children.length) {
        select.remove(children);
      }
    });

    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      const option = $("<option>").val(deviceInfo.deviceId);

      if (deviceInfo.kind === "audioinput") {
        option.text(
          deviceInfo.label ||
            "Microphone " + (audioSelect.children().length + 1)
        );
        audioSelect.append(option);
      } else if (deviceInfo.kind === "videoinput") {
        option.text(
          deviceInfo.label || "Camera " + (videoSelect.children().length + 1)
        );
        videoSelect.append(option);
      }
    }

    selectors.forEach((select, selectorIndex) => {
      if (
        Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })
      ) {
        select.val(values[selectorIndex]);
      }
    });

    videoSelect.on("change", step1);
    audioSelect.on("change", step1);
  });

  function step1() {
    // Get audio/video stream
    const audioSource = $("#audioSource").val();
    const videoSource = $("#videoSource").val();
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        $("#my-video").get(0).srcObject = stream;
        localStream = stream;

        if (room) {
          room.replaceStream(stream);
          return;
        }

        step2();
      })
      .catch(err => {
        $("#step1-error").show();
        console.error(err);
      });
  }

  function step2() {
    $("#step1, #step3").hide();
    $("#step2").show();
    $("#join-room").focus();
  }

  function step3(room) {
    // Wait for stream on the call, then set peer video display
    room.on("stream", stream => {
      const peerId = stream.peerId;
      const id =
        "video_" + peerId + "_" + stream.id.replace("{", "").replace("}", "");

      $("#their-videos").append(
        $(
          '<div class="video_' +
            peerId +
            '" id="' +
            id +
            '">' +
            "<label>" +
            stream.peerId +
            ":" +
            stream.id +
            "</label>" +
            '<video class="remoteVideos">' +
            "</div>"
        )
      );
      const el = $("#" + id)
        .find("video")
        .get(0);
      el.srcObject = stream;
      el.play();
    });

    room.on("removeStream", stream => {
      const peerId = stream.peerId;
      $(
        "#video_" + peerId + "_" + stream.id.replace("{", "").replace("}", "")
      ).remove();
    });

    // UI stuff
    room.on("close", step2);
    room.on("peerLeave", peerId => {
      $(".video_" + peerId).remove();
    });
    $("#step1, #step2").hide();
    $("#step3").show();
  }
});
