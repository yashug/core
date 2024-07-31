import { createRemoteSSRComponent } from '@modern-js/runtime/mf';

const RemoteSSRComponent = createRemoteSSRComponent({
  loader: () => import('host-provider/Image'),
  loading: 'loading...',
  export: 'Image',
  fallback: ({ error }) => {
    if (error instanceof Error && error.message.includes('not exist')) {
      return <div>fallback - not existed id</div>;
    }
    return <div>fallback</div>;
  },
});
const Index = () => (
  <div className="container-box">
    <h1>entry two page</h1>
  </div>
);

export default Index;
