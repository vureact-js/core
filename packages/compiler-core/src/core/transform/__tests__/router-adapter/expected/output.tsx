import { useCallback, memo } from 'react';
// @ts-ignore
import { onBeforeRouteLeave, onBeforeRouteUpdate, useLink, useRoute, useRouter, RouterLink, RouterView, useBeforeRouteLeave, useBeforeRouteUpdate } from '@vureact/router';
const Input = memo(() => {
  const router = useRouter();
  const route = useRoute();
  useBeforeRouteLeave(() => true);
  useBeforeRouteUpdate(() => true);
  const goAbout = useCallback(() => {
    router.push({
      path: '/about',
      query: {
        from: route.fullPath
      }
    });
  }, [router, route.fullPath]);
  const broken = useLink({
    to: '/about'
  });
  return <><RouterLink to='/about' customRender={({
      href,
      navigate,
      isActive
    }) => <a href={href} onClick={navigate}>{isActive ? 'active' : 'about'}</a>} /><RouterLink to='/profile' customRender={({
      href,
      navigate
    }) => <button onClick={navigate}>profile:{href}</button>} /><button onClick={goAbout}>Go</button><RouterView /></>;
});
export default Input;