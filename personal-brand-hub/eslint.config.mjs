// ESLint 9 flat config — FlatCompat/eslint-config-next(순환참조 validator 버그) 회피.
// @next/eslint-plugin-next를 직접 사용해 Next 권장 규칙만 적용(가볍고 안정).
import nextPlugin from "@next/eslint-plugin-next"

export default [
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "prisma/generated/**"],
  },
]
