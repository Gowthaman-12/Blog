// Simple frontend-only blog platform using localStorage
(function(){
  // Storage keys
  const USERS_KEY = 'simpleblog_users';
  const POSTS_KEY = 'simpleblog_posts';
  const CURRENT_KEY = 'simpleblog_current';

  // Elements
  const authArea = document.getElementById('auth-area');
  const authModal = document.getElementById('auth-modal');
  const authHeading = document.getElementById('auth-heading');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const authSubmit = document.getElementById('auth-submit');
  const authToggle = document.getElementById('auth-toggle');
  const authClose = document.getElementById('auth-close');
  const newPostSection = document.getElementById('new-post-section');
  const postTitle = document.getElementById('post-title');
  const postContent = document.getElementById('post-content');
  const createPostBtn = document.getElementById('create-post');
  const postsEl = document.getElementById('posts');

  let isRegister = false;

  // Helpers
  function read(key){return JSON.parse(localStorage.getItem(key)||'null')}
  function write(key,val){localStorage.setItem(key,JSON.stringify(val))}

  function getUsers(){return read(USERS_KEY)||[]}
  function saveUser(u){const arr=getUsers();arr.push(u);write(USERS_KEY,arr)}
  function findUser(name){return getUsers().find(u=>u.name===name)}

  function getPosts(){return read(POSTS_KEY)||[]}
  function savePosts(ps){write(POSTS_KEY,ps)}

  function currentUser(){return read(CURRENT_KEY)}
  function setCurrent(u){write(CURRENT_KEY,u)}
  function clearCurrent(){localStorage.removeItem(CURRENT_KEY)}

  // Auth UI
  function renderAuthArea(){
    const user = currentUser()
    if(user){
      authArea.innerHTML = `<span>Hi, ${user.name}</span> <button id="logout" class="btn">Logout</button>`
      document.getElementById('logout').onclick = ()=>{clearCurrent();renderAuthArea();renderNewPost();renderPosts()}
    } else {
      authArea.innerHTML = `<button id="login" class="btn">Login / Register</button>`
      document.getElementById('login').onclick = ()=>openAuth(false)
    }
  }

  function openAuth(register){
    isRegister = register
    authHeading.textContent = register ? 'Register' : 'Login'
    authSubmit.textContent = register ? 'Register' : 'Login'
    authModal.classList.remove('hidden')
  }

  authToggle.onclick = ()=>{ openAuth(!isRegister) }
  authClose.onclick = ()=>{ authModal.classList.add('hidden') }

  authSubmit.onclick = ()=>{
    const name = usernameInput.value.trim();
    const pass = passwordInput.value;
    if(!name || !pass) return alert('Provide username and password')
    if(isRegister){
      if(findUser(name)) return alert('User exists')
      saveUser({name,pass})
      setCurrent({name})
    } else {
      const u = findUser(name)
      if(!u || u.pass !== pass) return alert('Invalid login')
      setCurrent({name})
    }
    usernameInput.value='';passwordInput.value='';authModal.classList.add('hidden')
    renderAuthArea();renderNewPost();renderPosts()
  }

  // Posts
  function renderNewPost(){
    const user = currentUser()
    if(user){ newPostSection.classList.remove('hidden') } else { newPostSection.classList.add('hidden') }
  }

  function createPost(){
    const user = currentUser(); if(!user) return alert('Login required')
    const title = postTitle.value.trim(); const content = postContent.value.trim();
    if(!title || !content) return alert('Fill title and content')
    const posts = getPosts();
    const p = {id:Date.now(),title,content,author:user.name,created:new Date().toISOString(),comments:[]}
    posts.unshift(p); savePosts(posts); postTitle.value=''; postContent.value=''; renderPosts()
  }

  createPostBtn.onclick = createPost

  function renderPosts(){
    const posts = getPosts();
    postsEl.innerHTML = '';
    const user = currentUser()
    if(posts.length===0) postsEl.innerHTML = '<p class="card">No posts yet.</p>'
    posts.forEach(p=>{
      const div = document.createElement('div'); div.className='post card';
      div.innerHTML = `<h3>${escapeHtml(p.title)}</h3>
        <div class="meta">by ${escapeHtml(p.author)} • ${new Date(p.created).toLocaleString()}</div>
        <div class="content">${escapeHtml(p.content)}</div>
        <div class="controls"></div>
        <div class="comment-list"></div>`
      const controls = div.querySelector('.controls')
      if(user && user.name===p.author){
        const del = document.createElement('button'); del.className='btn'; del.textContent='Delete';
        del.onclick = ()=>{ if(confirm('Delete post?')){ deletePost(p.id) } }
        controls.appendChild(del)
      }
      // comments
      const commentList = div.querySelector('.comment-list')
      p.comments.forEach(c=>{
        const ce = document.createElement('div'); ce.className='comment';
        ce.innerHTML = `<strong>${escapeHtml(c.author)}</strong> — ${escapeHtml(c.text)}`
        commentList.appendChild(ce)
      })
      const cf = document.createElement('form'); cf.className='comment'; cf.onsubmit = (ev)=>{ev.preventDefault(); const inp=cf.querySelector('input'); addComment(p.id, inp.value); inp.value=''}
      cf.innerHTML = `<input placeholder="Add comment...">
        <button class="btn">Comment</button>`
      commentList.appendChild(cf)

      postsEl.appendChild(div)
    })
  }

  function deletePost(id){
    const posts = getPosts().filter(p=>p.id!==id); savePosts(posts); renderPosts()
  }

  function addComment(postId,text){
    const user = currentUser(); if(!user) return alert('Login to comment')
    text = (text||'').trim(); if(!text) return
    const posts = getPosts();
    const p = posts.find(x=>x.id===postId); if(!p) return
    p.comments.push({id:Date.now(),author:user.name,text,created:new Date().toISOString()});
    savePosts(posts); renderPosts()
  }

  function deleteAllData(){ if(confirm('Clear all demo data?')){ localStorage.removeItem(USERS_KEY); localStorage.removeItem(POSTS_KEY); localStorage.removeItem(CURRENT_KEY); renderAuthArea(); renderNewPost(); renderPosts() } }

  // small util
  function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;') }

  // init
  window.addEventListener('load',()=>{
    renderAuthArea(); renderNewPost(); renderPosts();
    // debug: clear data with Shift+Click header
    document.querySelector('header').ondblclick = ()=>deleteAllData()
  })

})();
