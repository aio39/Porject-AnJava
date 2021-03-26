# Plan

POST /api/register/ 회원가입  
POST /api/login/ 로그인  
GET /api/user/:userId/ - 특정 유저의 정보 불러오기

GET /api/room/all 전부 가져오기  
GET /api/room/:roomId 특정 호실 조회  
PUT /api/room/:roomId/reserve - 특정 호실에 대해 예약
PUT /api/room/:roomId/cancel - 특정 호실에 대해 예약 취소

검증은 전부 서버단에서 처리하기
회원가입 요청 -> 서버단에 확인 -> {isSuccess:false,실패문구:"~~ 때문에 실패", [true,true,true,false,false]}  
-> java 측에서 새로받은 JSON을 기준으로 리페인팅  
if true -> 다음 페이지 프레임 인스턴스 생성

로그인 요청 -> 서버단에서 확인 -> {isSuccess:false, 실패문구: "~~ 때문에 실패", [true,false] }
if ture -> 다음 페이즈 프레임 인스턴스 생성
