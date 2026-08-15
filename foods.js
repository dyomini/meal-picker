/* ============================================================
   음식 데이터베이스
   ------------------------------------------------------------
   음식 추가하는 법: 아래 FOODS 배열에 한 줄 추가하면 끝.

       f("음식이름", "카테고리", 가격, "플래그,플래그,플래그")

   [카테고리]  한식 중식 일식 양식 아시안 멕시칸 분식 고기 술안주 카페

   [가격]  1 = ~1만원   2 = 1~2.5만원   3 = 2.5만원~

   [플래그]
     solo    혼자 가서 1인분 시켜 먹기 자연스러움
     share   여럿이 나눠 먹는 음식 (회식용)
     mood    분위기 좋고 깔끔함
     date    데이트 강추
     booze   술 곁들이기 좋음
     smell   냄새·기름이 강함 (데이트/회의 전 비추)
     lab     평일 점심에 빠르게 먹기 좋음
     sea     해산물 들어감
     veg     채식으로 먹을 수 있음
     spicy1  약간 매움    spicy2  꽤 매움    spicy3  아주 매움
     heavy   묵직함       light   가벼움
     dessert 식사가 아닌 디저트 (기본적으로 추천에서 빠짐)

   ------------------------------------------------------------
   ※ 항목은 "메뉴판에서 고르는 단위"로 굵직하게 잡았습니다.
     짜장면/간짜장/삼선짜장처럼 갈래만 다른 건 하나로 묶고,
     옆의 주석에 무엇이 포함되는지 적어 두었습니다.
     더 잘게 쪼개고 싶으면 줄을 추가하시면 됩니다.

   ⚠️ 주의: "제외한 음식" 기록은 음식 이름을 기준으로 저장됩니다.
      이미 있는 음식의 이름을 바꾸면 그 음식의 제외 기록이 풀립니다.
   ============================================================ */

function f(name, cat, price, flags) {
  const set = new Set((flags || "").split(",").map(s => s.trim()).filter(Boolean));
  let spicy = 0;
  if (set.has("spicy3")) spicy = 3;
  else if (set.has("spicy2")) spicy = 2;
  else if (set.has("spicy1")) spicy = 1;
  return {
    id: name,
    name: name,
    cat: cat,
    price: price,
    spicy: spicy,
    solo:  set.has("solo"),
    share: set.has("share"),
    mood:  set.has("mood") || set.has("date"),
    date:  set.has("date"),
    booze: set.has("booze"),
    smell: set.has("smell"),
    lab:   set.has("lab"),
    sea:   set.has("sea"),
    veg:   set.has("veg"),
    heavy: set.has("heavy"),
    light: set.has("light"),
    dessert: set.has("dessert"),
  };
}

const FOODS = [

  // ─────────────────────── 한식: 찌개·탕·전골 ───────────────────────
  f("김치찌개", "한식", 1, "solo,share,lab,booze,spicy2,heavy"),
  f("된장찌개", "한식", 1, "solo,share,lab,veg,heavy"),
  f("순두부찌개", "한식", 1, "solo,lab,spicy2,sea"),
  f("부대찌개", "한식", 2, "share,booze,spicy2,heavy"),
  f("청국장", "한식", 1, "solo,lab,smell,veg,heavy"),
  f("생선매운탕", "한식", 2, "share,booze,sea,spicy2"),        // 동태·우럭·잡어매운탕
  f("생선맑은탕", "한식", 3, "share,sea,mood,light"),           // 대구탕·생태탕·복지리
  f("알탕", "한식", 2, "share,booze,sea,spicy1"),
  f("꽃게탕", "한식", 3, "share,booze,sea,spicy2"),
  f("해물탕", "한식", 3, "share,booze,sea,spicy2,heavy"),
  f("아구찜", "한식", 3, "share,booze,sea,spicy3,heavy"),
  f("추어탕", "한식", 2, "solo,lab,smell,heavy"),
  f("삼계탕", "한식", 2, "solo,lab,heavy"),
  f("닭한마리", "한식", 2, "share,booze,heavy"),
  f("갈비탕", "한식", 2, "solo,lab,heavy"),
  f("설렁탕", "한식", 2, "solo,lab,heavy"),                     // 곰탕·도가니탕·꼬리곰탕
  f("육개장", "한식", 1, "solo,lab,spicy2,heavy"),
  f("선지해장국", "한식", 1, "solo,lab,smell,spicy1"),
  f("뼈해장국", "한식", 1, "solo,lab,booze,spicy1,heavy"),
  f("콩나물국밥", "한식", 1, "solo,lab,light"),
  f("순대국밥", "한식", 1, "solo,lab,smell,heavy"),             // 돼지국밥 포함
  f("북엇국", "한식", 1, "solo,lab,sea,light"),                 // 황태해장국 포함
  f("미역국백반", "한식", 1, "solo,lab,sea,light"),
  f("닭볶음탕", "한식", 2, "share,booze,spicy2,heavy"),
  f("감자탕", "한식", 2, "share,booze,spicy1,heavy"),
  f("곱창전골", "한식", 3, "share,booze,smell,spicy1,heavy"),
  f("불고기전골", "한식", 3, "share,mood,date"),                // 소고기전골 포함
  f("버섯전골", "한식", 2, "share,veg,light,mood"),
  f("두부전골", "한식", 2, "share,veg,light"),
  f("만두전골", "한식", 2, "share,booze"),
  f("낙지전골", "한식", 3, "share,booze,sea,spicy2"),           // 불낙전골 포함

  // ─────────────────────── 한식: 밥·백반·덮밥 ───────────────────────
  f("제육볶음", "한식", 1, "solo,share,lab,booze,spicy2,heavy"),
  f("오징어볶음", "한식", 1, "solo,share,lab,sea,spicy2"),
  f("낙지볶음", "한식", 2, "share,booze,sea,spicy3"),           // 쭈꾸미볶음 포함
  f("낙곱새", "한식", 3, "share,booze,sea,smell,spicy3"),
  f("불고기백반", "한식", 2, "solo,share,lab,mood"),            // 연탄불고기 포함
  f("비빔밥", "한식", 1, "solo,lab,veg,mood"),                  // 돌솥·전주·산채·보리비빔밥
  f("육회비빔밥", "한식", 2, "solo,mood"),
  f("콩나물불고기", "한식", 2, "share,booze,spicy1"),
  f("두루치기", "한식", 2, "share,booze,spicy2,heavy"),         // 돼지주물럭 포함
  f("간장게장", "한식", 3, "share,sea,mood"),
  f("양념게장", "한식", 3, "share,sea,spicy2"),
  f("보쌈", "한식", 2, "share,booze,heavy"),                    // 보쌈정식 포함
  f("수육백반", "한식", 2, "solo,share,lab"),
  f("김치볶음밥", "한식", 1, "solo,lab,spicy1"),
  f("오므라이스", "한식", 1, "solo,lab,light"),
  f("제육덮밥", "한식", 1, "solo,lab,spicy2"),
  f("오징어덮밥", "한식", 1, "solo,lab,sea,spicy2"),
  f("불고기덮밥", "한식", 1, "solo,lab"),
  f("회덮밥", "한식", 2, "solo,lab,sea,light,mood"),
  f("죽", "한식", 1, "solo,light"),                             // 전복죽·호박죽·소고기죽
  f("굴국밥", "한식", 1, "solo,lab,sea,light"),
  f("한정식", "한식", 3, "share,mood,date"),                    // 연잎밥·보리굴비정식
  f("쌈밥정식", "한식", 2, "share,veg,mood"),
  f("생선구이백반", "한식", 2, "solo,lab,sea,smell"),
  f("생선조림", "한식", 2, "share,sea,spicy1"),                 // 고등어·갈치·코다리조림
  f("장어덮밥", "한식", 3, "solo,sea,mood,heavy"),
  f("잡채", "한식", 2, "share,veg,mood"),

  // ─────────────────────── 한식: 면 ───────────────────────
  f("칼국수", "한식", 1, "solo,lab,light"),                     // 바지락·들깨·장·닭·해물칼국수
  f("콩국수", "한식", 1, "solo,lab,veg,light"),
  f("잔치국수", "한식", 1, "solo,lab,light"),
  f("비빔국수", "한식", 1, "solo,lab,spicy2,light"),            // 쫄면 포함
  f("막국수", "한식", 1, "solo,lab,spicy1,light"),
  f("냉면", "한식", 2, "solo,lab,light,mood"),                  // 평양·함흥냉면·밀면
  f("수제비", "한식", 1, "solo,lab,veg,light"),
  f("초계국수", "한식", 2, "solo,light,mood"),

  // ─────────────────────── 한식: 전·안주 ───────────────────────
  f("파전", "한식", 2, "share,booze,sea"),                      // 해물파전 포함
  f("김치전", "한식", 1, "share,booze,veg,spicy1"),
  f("감자전", "한식", 1, "share,booze,veg"),
  f("빈대떡", "한식", 2, "share,booze,heavy"),
  f("모듬전", "한식", 2, "share,booze"),
  f("두부김치", "한식", 1, "share,booze,veg,spicy1"),
  f("골뱅이무침", "한식", 2, "share,booze,sea,spicy2"),
  f("홍어삼합", "한식", 3, "share,booze,smell,sea"),
  f("육회", "한식", 3, "share,booze,mood"),
  f("닭발", "한식", 2, "share,booze,smell,spicy3"),
  f("족발", "한식", 2, "share,booze,heavy"),                    // 불족발 포함
  f("찜닭", "한식", 2, "share,booze,spicy1,heavy"),
  f("갈비찜", "한식", 3, "share,mood,date,heavy"),
  f("떡갈비", "한식", 3, "share,mood,heavy"),

  // ─────────────────────── 고기·구이 ───────────────────────
  f("삼겹살", "고기", 2, "share,booze,smell,heavy"),
  f("돼지고기구이", "고기", 2, "share,booze,smell,heavy"),      // 목살·항정살·갈매기살·가브리살
  f("소고기구이", "고기", 3, "share,booze,smell,mood,heavy"),   // 등심·안창살·토시살·차돌박이
  f("소갈비", "고기", 3, "share,booze,smell,mood,date,heavy"),  // 양념갈비·생갈비
  f("돼지갈비", "고기", 2, "share,booze,smell,heavy"),
  f("양갈비", "고기", 3, "share,booze,smell,mood,heavy"),
  f("양꼬치", "고기", 2, "share,booze,smell"),
  f("곱창구이", "고기", 3, "share,booze,smell,heavy"),          // 막창·대창
  f("닭갈비", "고기", 2, "share,booze,smell,spicy2,heavy"),
  f("오리고기", "고기", 2, "share,booze,smell"),                // 로스·훈제·주물럭
  f("장어구이", "고기", 3, "share,booze,sea,mood,heavy"),
  f("바베큐립", "고기", 3, "share,booze,mood,heavy"),
  f("한우오마카세", "고기", 3, "mood,date"),
  f("샤브샤브", "고기", 3, "share,mood,date,light"),
  f("돼지껍데기", "고기", 1, "share,booze,smell"),
  f("닭꼬치", "고기", 1, "solo,share,booze"),

  // ─────────────────────── 분식 ───────────────────────
  f("떡볶이", "분식", 1, "solo,share,lab,veg,spicy2,light"),    // 로제·치즈·국물떡볶이
  f("즉석떡볶이", "분식", 1, "share,lab,spicy2"),
  f("김밥", "분식", 1, "solo,lab,light"),                       // 참치·충무·꼬마김밥
  f("순대", "분식", 1, "solo,share,smell"),
  f("순대볶음", "분식", 1, "share,booze,smell,spicy2"),
  f("튀김", "분식", 1, "solo,share,lab,heavy"),
  f("오뎅탕", "분식", 1, "share,booze,sea,light"),
  f("라볶이", "분식", 1, "solo,lab,spicy2"),
  f("토스트", "분식", 1, "solo,lab,light"),
  f("핫도그", "분식", 1, "solo,lab,light"),
  f("만두", "분식", 1, "solo,share,lab"),                       // 고기·김치·군만두·왕만두
  f("만두국", "분식", 1, "solo,lab,light"),                     // 떡만두국 포함
  f("유부초밥", "분식", 1, "solo,lab,veg,light"),
  f("주먹밥", "분식", 1, "solo,lab,light"),
  f("라면", "분식", 1, "solo,lab,spicy1"),                      // 치즈·떡라면
  f("닭강정", "분식", 1, "share,booze,spicy1,heavy"),
  f("호떡", "분식", 1, "solo,veg,light,dessert"),
  f("붕어빵", "분식", 1, "solo,veg,light,dessert"),

  // ─────────────────────── 중식 ───────────────────────
  f("짜장면", "중식", 1, "solo,lab,heavy"),                     // 간짜장·삼선·유니·쟁반짜장
  f("짬뽕", "중식", 1, "solo,lab,sea,spicy2"),                  // 삼선·백·차돌·굴짬뽕
  f("볶음밥", "중식", 1, "solo,lab"),                           // 새우·게살볶음밥
  f("탕수육", "중식", 2, "share,booze,heavy"),                  // 찹쌀탕수육 포함
  f("깐풍기", "중식", 2, "share,booze,spicy1"),                 // 라조기·유린기
  f("깐쇼새우", "중식", 3, "share,booze,sea,spicy1"),           // 칠리새우·크림새우
  f("팔보채", "중식", 3, "share,booze,sea"),
  f("유산슬", "중식", 3, "share,booze,sea"),
  f("고추잡채", "중식", 2, "share,booze,spicy1"),               // 꽃빵 포함
  f("양장피", "중식", 3, "share,booze,sea,mood"),
  f("마파두부", "중식", 1, "solo,lab,veg,spicy2"),
  f("마라탕", "중식", 2, "solo,lab,spicy3"),
  f("마라샹궈", "중식", 2, "share,booze,spicy3,heavy"),         // 마라룽샤 포함
  f("훠궈", "중식", 3, "share,booze,spicy2,heavy"),
  f("꿔바로우", "중식", 2, "share,booze,heavy"),
  f("동파육", "중식", 3, "share,booze,heavy"),
  f("북경오리", "중식", 3, "share,mood,date,heavy"),
  f("딤섬", "중식", 2, "share,mood,date,light"),                // 샤오롱바오·하가우
  f("탄탄면", "중식", 1, "solo,lab,spicy2"),
  f("우육면", "중식", 2, "solo,lab,heavy"),                     // 도삭면 포함
  f("멘보샤", "중식", 3, "share,booze,sea,heavy"),
  f("어향가지", "중식", 2, "share,veg,spicy1"),                 // 가지튀김 포함
  f("쿵파오치킨", "중식", 2, "share,booze,spicy2"),

  // ─────────────────────── 일식 ───────────────────────
  f("초밥", "일식", 2, "solo,share,sea,mood,date,light"),       // 연어·장어초밥
  f("스시오마카세", "일식", 3, "sea,mood,date"),
  f("사시미", "일식", 3, "share,booze,sea,mood,date"),          // 모듬회 포함
  f("사케동", "일식", 2, "solo,lab,sea,mood,light"),            // 치라시동·가이센동·우니동
  f("가츠동", "일식", 1, "solo,lab,heavy"),
  f("규동", "일식", 1, "solo,lab"),                             // 부타동 포함
  f("오야코동", "일식", 1, "solo,lab"),
  f("텐동", "일식", 2, "solo,lab,sea,heavy"),
  f("장어덮밥(우나기동)", "일식", 3, "solo,sea,mood,heavy"),
  f("라멘", "일식", 1, "solo,lab,heavy"),                       // 돈코츠·시오·쇼유·미소라멘
  f("츠케멘", "일식", 2, "solo,lab,heavy"),
  f("마제소바", "일식", 1, "solo,lab,spicy1"),
  f("우동", "일식", 1, "solo,lab,veg,light"),                   // 가케·붓카케우동
  f("소바", "일식", 1, "solo,lab,veg,light"),                   // 자루소바·냉모밀·텐푸라소바
  f("돈까스", "일식", 1, "solo,lab,heavy"),                     // 등심·치즈·카레돈까스
  f("규카츠", "일식", 2, "solo,lab,heavy"),                     // 멘치카츠 포함
  f("일본식카레", "일식", 1, "solo,lab,spicy1"),                // 카츠카레 포함
  f("함박스테이크", "일식", 2, "solo,lab,mood,heavy"),
  f("고로케", "일식", 1, "solo,light"),
  f("오코노미야키", "일식", 2, "share,booze,sea"),
  f("야키소바", "일식", 1, "solo,lab"),
  f("타코야키", "일식", 1, "solo,share,sea,light"),
  f("야키토리", "일식", 2, "share,booze,mood"),                 // 이자카야 꼬치 모듬
  f("스키야키", "일식", 3, "share,mood,date,heavy"),
  f("나베", "일식", 2, "share,booze,mood"),                     // 모츠나베 포함
  f("생선구이정식", "일식", 2, "solo,lab,sea,smell"),           // 사바시오야키·샤케정식
  f("정식도시락", "일식", 2, "solo,lab,mood"),
  f("차완무시", "일식", 2, "solo,light,mood"),
  f("가라아게", "일식", 1, "solo,share,booze,heavy"),           // 치킨난반 포함
  f("교자", "일식", 1, "solo,share,booze"),

  // ─────────────────────── 양식: 파스타·피자 ───────────────────────
  f("크림파스타", "양식", 2, "solo,lab,mood,date,heavy"),       // 까르보나라·트러플크림
  f("토마토파스타", "양식", 2, "solo,lab,veg,mood"),            // 아라비아타·라구
  f("오일파스타", "양식", 2, "solo,sea,mood,date,light"),       // 알리오올리오·봉골레·해산물
  f("로제파스타", "양식", 2, "solo,lab,mood,date"),
  f("라자냐", "양식", 3, "share,mood,date,heavy"),
  f("뇨끼", "양식", 2, "solo,veg,mood"),
  f("리조또", "양식", 2, "solo,mood,date"),                     // 해산물·트러플리조또
  f("피자", "양식", 2, "share,booze,mood,heavy"),               // 마르게리타·페퍼로니·고르곤졸라 등

  // ─────────────────────── 양식: 메인 ───────────────────────
  f("스테이크", "양식", 3, "mood,date,booze,heavy"),            // 티본·립아이·안심
  f("코스요리", "양식", 3, "mood,date"),
  f("부야베스", "양식", 3, "share,sea,mood,date"),
  f("빠에야", "양식", 3, "share,sea,mood,date"),
  f("감바스", "양식", 2, "share,booze,sea,mood,date"),
  f("타파스", "양식", 2, "share,booze,mood,date"),
  f("연어스테이크", "양식", 3, "solo,sea,mood,date,light"),
  f("소시지플래터", "양식", 3, "share,booze,smell,heavy"),      // 슈니첼·학센·독일식
  f("굴라쉬", "양식", 2, "solo,heavy"),
  f("수프", "양식", 1, "solo,lab,veg,light"),                   // 어니언수프·클램차우더·미네스트로네
  f("라따뚜이", "양식", 2, "share,veg,mood,light"),

  // ─────────────────────── 양식: 캐주얼 ───────────────────────
  f("햄버거", "양식", 1, "solo,lab,heavy"),                     // 수제·치즈·치킨버거
  f("샌드위치", "양식", 1, "solo,lab,light"),                   // 클럽·파니니·베이글·치아바타
  f("샐러드", "양식", 1, "solo,lab,veg,light,mood"),            // 시저·치킨샐러드
  f("포케", "양식", 2, "solo,lab,sea,mood,light"),
  f("카프레제", "양식", 2, "share,veg,mood,date,light"),
  f("피쉬앤칩스", "양식", 2, "share,booze,sea,heavy"),
  f("맥앤치즈", "양식", 1, "solo,veg,heavy"),
  f("오믈렛", "양식", 1, "solo,lab,veg,light"),
  f("에그베네딕트", "양식", 2, "solo,mood,date,light"),
  f("감자튀김", "양식", 1, "solo,share,booze,veg,heavy"),

  // ─────────────────────── 아시안 ───────────────────────
  f("쌀국수", "아시안", 1, "solo,lab,light"),
  f("분짜", "아시안", 2, "solo,lab,mood,light"),
  f("반미", "아시안", 1, "solo,lab,light"),
  f("월남쌈", "아시안", 2, "share,veg,mood,date,light"),
  f("짜조", "아시안", 1, "solo,share,booze"),
  f("반쎄오", "아시안", 2, "share,mood"),
  f("팟타이", "아시안", 1, "solo,lab,sea"),
  f("똠얌꿍", "아시안", 2, "share,sea,spicy2"),
  f("태국커리", "아시안", 2, "solo,share,spicy2"),              // 그린·레드·마사만커리
  f("카오팟", "아시안", 1, "solo,lab"),                         // 팟카파오 포함
  f("쏨땀", "아시안", 1, "share,veg,spicy2,light"),
  f("푸팟퐁커리", "아시안", 3, "share,sea,mood,date"),
  f("나시고랭", "아시안", 1, "solo,lab,spicy1"),                // 미고랭 포함
  f("사테", "아시안", 2, "share,booze"),
  f("락사", "아시안", 2, "solo,sea,spicy2"),
  f("바쿠테", "아시안", 2, "share,heavy"),
  f("하이난치킨라이스", "아시안", 1, "solo,lab,light"),
  f("인도커리", "아시안", 2, "solo,share,mood,spicy1"),         // 버터치킨·티카마살라·팔락파니르·달
  f("탄두리치킨", "아시안", 2, "share,booze,spicy1"),
  f("비리야니", "아시안", 2, "solo,share,spicy1,heavy"),
  f("사모사", "아시안", 1, "solo,share,veg"),
  f("케밥", "아시안", 1, "solo,lab,heavy"),                     // 샤와르마·이스켄데르
  f("팔라펠", "아시안", 1, "solo,veg,light"),
  f("후무스", "아시안", 2, "share,veg,mood,light"),
  f("샤슬릭", "아시안", 2, "share,booze,smell"),
  f("모모", "아시안", 1, "solo,share,light"),
  f("아도보", "아시안", 2, "solo,share,heavy"),
  f("룬당", "아시안", 2, "solo,share,spicy2,heavy"),
  f("완탕면", "아시안", 1, "solo,lab,light"),

  // ─────────────────────── 멕시칸·남미 ───────────────────────
  f("타코", "멕시칸", 1, "solo,share,booze,spicy1"),            // 알파스토르·생선타코
  f("부리또", "멕시칸", 1, "solo,lab,heavy"),                   // 치미창가 포함
  f("엔칠라다", "멕시칸", 2, "share,spicy2"),
  f("퀘사디아", "멕시칸", 1, "solo,share,booze"),
  f("나초", "멕시칸", 1, "share,booze,veg,spicy1"),
  f("과카몰리", "멕시칸", 1, "share,booze,veg,light"),
  f("파히타", "멕시칸", 3, "share,booze,mood"),
  f("칠리콘카르네", "멕시칸", 2, "share,booze,spicy2,heavy"),
  f("세비체", "멕시칸", 2, "share,sea,mood,date,light"),
  f("슈하스코", "멕시칸", 3, "share,booze,mood,heavy"),         // 아사도 포함
  f("엠파나다", "멕시칸", 1, "solo,share,booze"),

  // ─────────────────────── 술안주·2차 ───────────────────────
  f("후라이드치킨", "술안주", 2, "share,booze,heavy"),          // 파닭·마늘치킨
  f("양념치킨", "술안주", 2, "share,booze,spicy1,heavy"),       // 간장·반반치킨
  f("오돌뼈", "술안주", 2, "share,booze,spicy2"),
  f("계란말이", "술안주", 1, "share,booze,veg,light"),
  f("조개찜", "술안주", 2, "share,booze,sea,light"),            // 홍합탕 포함
  f("새우·가리비구이", "술안주", 3, "share,booze,sea,mood"),
  f("전복구이", "술안주", 3, "share,booze,sea,mood,date"),
  f("문어숙회", "술안주", 3, "share,booze,sea,mood"),
  f("오징어숙회", "술안주", 2, "share,booze,sea,light"),
  f("해물찜", "술안주", 3, "share,booze,sea,spicy2"),
  f("과메기", "술안주", 3, "share,booze,sea,smell"),
  f("육전", "술안주", 2, "share,booze,mood"),
  f("마른안주", "술안주", 1, "share,booze,sea,light"),          // 먹태·노가리·황도
  f("치즈·하몽플래터", "술안주", 3, "share,booze,mood,date,light"),

  // ─────────────────────── 카페·브런치·디저트 ───────────────────────
  f("브런치플레이트", "카페", 2, "solo,mood,date,light"),       // 팬케이크·프렌치토스트·와플
  f("퀴시", "카페", 2, "solo,mood,light"),
  f("케이크", "카페", 1, "solo,veg,mood,date,light,dessert"),   // 치즈·당근케이크·티라미수
  f("마카롱", "카페", 1, "solo,veg,mood,date,light,dessert"),
  f("베이커리", "카페", 1, "solo,veg,mood,light,dessert"),      // 크루아상·소금빵·스콘·에그타르트
  f("크로플", "카페", 1, "solo,veg,mood,date,light,dessert"),
  f("빙수", "카페", 2, "share,veg,mood,date,light,dessert"),    // 팥·망고빙수
  f("아이스크림", "카페", 1, "solo,veg,mood,light,dessert"),    // 젤라또 포함
  f("도넛", "카페", 1, "solo,veg,light,dessert"),
  f("스무디볼", "카페", 1, "solo,veg,mood,light,dessert"),      // 아사이볼 포함
  f("약과", "카페", 1, "solo,veg,light,dessert"),               // 한과 포함
  f("호두과자", "카페", 1, "solo,veg,light,dessert"),

];
