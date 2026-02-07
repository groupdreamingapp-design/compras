/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#0F172A',
                surface: '#1E293B',
                primary: {
                    start: '#E91E63',
                    end: '#9C27B0',
                },
                secondary: {
                    start: '#00BCD4',
                    end: '#2196F3',
                },
                alert: '#EF4444',
                success: '#10B981',
                warning: '#F59E0B',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'aurora-primary': 'linear-gradient(to right, #E91E63, #9C27B0)',
                'aurora-secondary': 'linear-gradient(to right, #00BCD4, #2196F3)',
            },
        },
    },
    plugins: [],
}
