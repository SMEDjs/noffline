<script>
  import moment from 'moment';
  
  let user = null,
      player = null,
      rank = null,
      data = null,
      error = null,
      fetching = false,
      timeout = null,
      activity = []
  
  
  const enums = {
    VAMPIREZ: "VampireZ",
    MURDER_CLASSIC: "Classic",
    HIDE_AND_SEEK_PARTY_POOPER: "Party Pooper",
    HIDE_AND_SEEK_PROP_HUNT: "Prop Hunt",
    DUELS_SUMO_DUEL: "Sumo",
    DUELS_UHC_DUEL: "UHC",
    DUELS_CLASSIC_DUEL: "Classic",
    DUELS_BRIDGE_DUEL: "Bridge",
    DUELS_SW_DUEL: "Skywars",
    DUELS_PARKOUR_EIGHT: "Parkour",
    DUELS_BOWSPLEEF_DUEL: "Bowspleef",
    DUELS_BLITZ_DUEL: "Blitz",
    DUELS_MW_DUEL: "Mega Walls",
    DUELS_OP_DUEL: "OP",
    DUELS_COMBO_DUEL: "Combo",
    DUELS_POTION_DUEL: "NoDebuff",
    DUELS_BOW_DUEL: "Bow",
    DUELS_BOXING_DUEL: "Boxing"
  }
  
  function clean(e) {
    if(!e) return;
    if(typeof e === "number") {
      return new Intl.NumberFormat('en-US').format(e)
    } 
    if(typeof e === "string") {
      if(enums[e]) return enums[e]
      const cleaned = e.toLowerCase().replaceAll("_", " ")
      return cleaned.charAt(0).toUpperCase() + cleaned.substring(1).toLowerCase();
    }
    return null;
  }
  
  function deepEqual(newValue, oldValue) {
    const changes = [];
    (function check(newValue, oldValue, keyStack = "") {
        if (newValue && oldValue && typeof newValue === "object" && typeof oldValue === "object") return Object.keys(newValue).length === Object.keys(oldValue).length && Object.keys(newValue).map(key => check(newValue[key], oldValue[key], keyStack ? keyStack + "." + key : key));
        newValue !== oldValue && changes.push({
          key: keyStack,
          newValue,
          oldValue
        });
    })(newValue, oldValue);
    return changes;
  }

  
  async function onsubmit(e) {
    const check = user?.username;
    user = Object.fromEntries(new FormData(e.target).entries());
    if (check === user.username) return;
    clearTimeout(timeout);
    fetching = true;
    player = null;
    rank = null;
    error = null;
    data = null;
    activity = [];
    const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(user.username)}`).then(res => res.json());
    if (res.error) return (fetching = false), (error = res.reason);
    
    (async function checkStatus() {
      if(check === user.username) return;
      data = await fetch(`/api/activity/${res.uuid}`).then(res => res.json());
      console.log(data)
      const previous = player;
      player = data.stats
      fetching = false;
      if(!player) return error = "this player have no stats."
      if(data.error) return error = data.message ? data.message : "something went wrong"
      rank = player.rank ? player.rank : player.monthlyPackageRank === "SUPERSTAR" ? `mvpplusplus` : player.newPackageRank;

      if(previous && player) {
        const result = deepEqual(player, previous)
        if(result.length) {
          result.map(e => activity.push({success: true, key: e.key, new: e.newValue, old: e.oldValue, date: Date.now()}));
          activity = activity;
          console.log(activity)  
        } else {
          activity.push({success: false, message: "No stats changed...", date: Date.now()})
          activity = activity;
        }
      } else {
        activity.push({success: false, message: "Stats fetched successfully", date: Date.now()})
        activity = activity;
      }
      
      timeout = setTimeout(() => checkStatus(), 10000)
      console.log(timeout)
    })(); 
  }
</script>

<main>
  
  <div class="bg-neutral-900/50 flex justify-around items-center flex-col h-[20vh] md:h-[10vh] md:flex-row">
    <div class="flex items-center">
      <img class="mx-6 h-16" src="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/322/rainbow-flag_1f3f3-fe0f-200d-1f308.png" alt="flag"/>
      <div class="minecraftia uppercase text-2xl">noffline</div>
    </div>
    <form on:submit|preventDefault={onsubmit} action="" method="get" class="flex justify-around">
      <input type="text" name="username" placeholder="username" class="ease-out duration-150 bg-neutral-900 mx-4 rounded-lg focus:outline-none focus:ring focus:ring-indigo-500 px-2 py-2" required>
      <input type="submit" value="Track!" class="ease-out duration-150 bg-indigo-500 hover:bg-indigo-600 py-2 px-2 md:px-12 rounded-lg cursor-pointer" disabled="{fetching}">
    </form> 
  </div>
  {#if !user}
    <div class="mt-10 flex justify-center">
      search for a user..
    </div>
  {:else}
    <div class="flex justify-center">
      {#if player}
      <div class="flex justify-center flex-col minecraftia items-center w-full">
        <div class="flex my-4">
          <div>
            <div class="{data?.online ? 'bg-green-500' : 'bg-red-500'} circle shadow"></div>
            <img src={`https://mc-heads.net/avatar/${player.uuid}/100`} alt="avatar" class="rounded-lg shadow" />
          </div>
          <div class="mx-2 flex flex-col">
            <div class="{rank === 'mvpplusplus' ? player.monthlyRankColor ? player.monthlyRankColor : 'GOLD' : rank ? rank : 'GRAY'} flex">
              {#if rank && !error}
                <div class="{rank === 'mvpplusplus' ? player.monthlyRankColor ? player.monthlyRankColor : 'GOLD' : rank} flex">
                  {#if rank === "mvpplusplus"}
                    [MVP<div class="{player.rankPlusColor ? player.rankPlusColor : 'RED'}">++</div>]
                  {:else if rank === "MVP_PLUS"}
                    [MVP<div class="{player.rankPlusColor ? player.rankPlusColor : 'RED'}">+</div>]
                  {:else if rank === "VIP_PLUS"}
                    [VIP<div class="GOLD">+</div>]
                  {:else}
                    [{rank}]
                  {/if}
                </div>
              {/if}
              <div class="{rank ? 'mx-2' : ''}">
                {player.displayname}
              </div>
            </div>
            <div class="minecraftia flex flex-col">
              <div class="flex">
                <div class="GRAY">Level:</div>
                <div class="GOLD mx-2">{player.networkExp ? clean(Math.floor(Math.sqrt(player.networkExp/1250 + 12.25) - 3.5) + 1) : 0}</div>
              </div>
              <div class="flex">
                <div class="GRAY">Karma:</div>
                <div class="LIGHT_PURPLE mx-2">{player.karma ? clean(player.karma) : 0}</div>
              </div>
              {#if data?.playing?.gameType}
                <div class="flex">
                  <div class="GRAY">in</div>
                  <div class="RED mx-2">{clean(data?.playing?.gameType)}{data.playing.mode ? ` ${clean(data.playing.mode)}` : ""}</div>
                </div>
              {/if}
            </div>
          </div>
        </div>
        {#if activity}
          <div class="flex flex-col-reverse w-full md:w-fit">
            {#each activity as flag, i}
              <div class="flex">
                <div class="DARK_GRAY mx-2 text-right" >
                  {moment(flag.date).format('LT').replaceAll(" PM", "").replaceAll(" AM", "")}
                </div>
                <div class="flex">
                  {#if flag.success}
                    <div class="GOLD flex mr-2">
                      {#each flag.key.split(".") as name, i}
                        <div>
                          {name}  
                        </div>
                        {#if i + 1 != flag.key.split(".").length}
                          <div class="DARK_GRAY font-bold mx-2">
                            >  
                          </div>
                        {/if}
                      {/each}
                    </div>
                    <div class="flex">
                      <div class="RED">
                        {clean(flag.old)}
                      </div>
                      <div class="YELLOW mx-2 font-bold">
                        ➜
                      </div>
                      <div class="GREEN">
                        {clean(flag.new)}
                      </div>
                    </div>
                  {:else}
                    <div class="GRAY">
                      {flag.message ? flag.message : "error"}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
          {/if}
        </div>
      {:else if error}
        <div class="error RED minecraftia mt-10">
          {error}
        </div>
      {:else}
        <div class="loader h-12 w-12 mt-10">

        </div>
      {/if}
    </div>
  {/if}
</main>
<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  .circle {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    position: absolute;
    margin: -2px;
  }
  .minecraftia {
   font-family: 'MinecraftiaRegular';
   font-weight: normal;
   font-style: normal;
  }
  .shadow {
    box-shadow: 0px 0px 9px 2px #0000001c
  }
  .GOLD {
    color: #FFAA00;
  }
  .BLACK {
    color: #000000;
  }
  .DARK_RED {
    color: #AA0000;
  }
  .YELLOW {
    color: #FFFF55;
  }
  .DARK_GREEN {
    color: #00AA00;
  }
  .RED, .ADMIN {
    color: #FF5555;
  }
  .VIP_PLUS, .VIP, .GREEN {
    color: #55FF55;
  }
  .AQUA, .MVP_PLUS {
    color: #55FFFF;
  }
  .DARK_AQUA {
    color: #00AAAA;
  }
  .DARK_BLUE {
    color: #0000AA;
  }
  .BLUE {
    color: #5555FF;
  }
  .LIGHT_PURPLE {
    color: #FF55FF;
  }
  .DARK_PURPLE {
    color: #AA00AA;
  }
  .GRAY {
    color: #AAAAAA;
  }
  .DARK_GRAY {
    color: #555555;
  }
  .DARK_GRAY::before {
    content: var(--beforeContent);
  }
  .DARK {
    color: #000000;
  }
  .WHITE {
    color: #FFFFFF;
  }
  .loader {
    border: 3px solid transparent;
    border-left: 3px solid white;
    border-right: 3px solid white;
    border-radius: 36px;
    animation: rotation 1s infinite ease-in-out;
  }
  
  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(359deg);
    }
  }
</style>