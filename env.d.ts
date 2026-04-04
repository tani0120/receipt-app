/// <reference types="vite/client" />

// .vue ファイルの型宣言（vite/client.d.tsに含まれないため明示追加）
// Z-12/Z-13/Z-14: TS2307 "Cannot find module '*.vue'"を全件解消
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
