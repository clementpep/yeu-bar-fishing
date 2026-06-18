<script lang="ts">
  import { page } from '$app/stores';
  const tabs = [
    { href: '/', label: 'Le moment' },
    { href: '/savoir', label: 'Savoir' },
    { href: '/carnet', label: 'Carnet' },
    { href: '/duel', label: 'Duel' },
    { href: '/profil', label: 'Profil' }
  ];
  const isActive = (href: string, path: string) =>
    href === '/' ? path === '/' : path.startsWith(href);
</script>

<nav class="tabbar">
  {#each tabs as tab}
    <a
      href={tab.href}
      class="tab"
      aria-current={isActive(tab.href, $page.url.pathname) ? 'page' : undefined}
    >
      {tab.label}
    </a>
  {/each}
</nav>

<style>
  .tabbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    display: flex;
    justify-content: space-around;
    background: color-mix(in srgb, var(--color-marine) 92%, black);
    border-top: 1px solid var(--color-slate);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 10;
  }
  .tab {
    flex: 1;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--color-text-muted);
    text-decoration: none;
  }
  .tab[aria-current='page'] { color: var(--color-brass); font-weight: 600; }
</style>
