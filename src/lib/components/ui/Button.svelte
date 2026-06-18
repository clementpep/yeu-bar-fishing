<script lang="ts">
  let { variant = 'primary', type = 'button', disabled = false, children, onclick }:
    { variant?: 'primary' | 'ghost'; type?: 'button' | 'submit'; disabled?: boolean; children?: any; onclick?: (e: MouseEvent) => void } = $props();
</script>

<button class="btn {variant}" {type} {disabled} {onclick}>
  {@render children?.()}
</button>

<style>
  .btn {
    min-height: 44px;
    padding: 0 var(--space-6);
    border-radius: 12px;
    font: inherit;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: transform 120ms ease, background 120ms ease;
  }
  .btn:active { transform: scale(0.98); }
  .btn.primary { background: var(--color-brass); color: var(--color-abyss); }
  .btn.ghost { background: transparent; color: var(--color-text); border-color: var(--color-slate); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
