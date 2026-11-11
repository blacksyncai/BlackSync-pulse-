import GlassWorkspace from '@/components/ui/adjustable-glass-dashboard';

export default function GlassWorkspaceDemo() {
  return (
    <GlassWorkspace>
      <section
        style={{
          background: 'var(--dashboard-glass-surface)',
          border: '1px solid var(--dashboard-glass-edge)',
          borderRadius: 24,
          padding: 24,
          backdropFilter:
            'blur(var(--dashboard-blur)) saturate(var(--dashboard-saturation))',
        }}
      >
        <h2>BlackSync workspace</h2>
        <p>
          Use Adjust glass to customize the material. Your CRM supplies the
          content.
        </p>
      </section>
    </GlassWorkspace>
  );
}
