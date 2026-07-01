const CACHE='bgmplayer-v3';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon.png'];

self.addEventListener('install',e=>{
  // 새 서비스워커가 설치되면 즉시 대기 상태를 건너뛰고 활성화 준비
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  // 옛 캐시 정리 후 모든 열린 탭을 즉시 이 서비스워커가 제어
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // 앱 코드(html/js/json/아이콘)는 '네트워크 먼저': 온라인이면 항상 최신, 실패하면 캐시
  e.respondWith(
    fetch(e.request).then(resp=>{
      // 성공하면 최신본을 캐시에 갱신해 둠(다음 오프라인 대비)
      const cp=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return resp;
    }).catch(()=>
      // 네트워크 실패(오프라인) → 캐시된 버전, 없으면 index로 폴백
      caches.match(e.request).then(r=>r||caches.match('./index.html'))
    )
  );
});
