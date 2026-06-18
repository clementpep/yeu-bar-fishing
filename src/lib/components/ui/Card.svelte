<script lang="ts">
  let { children }: { children?: any } = $props();
</script>

<div class="card">{@render children?.()}</div>

<style>
  .card {
    background: var(--color-slate);
    border-radius: 16px;
    padding: var(--space-6);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  }
</style>
