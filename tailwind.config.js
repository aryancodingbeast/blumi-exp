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
                terracotta: {
                    50: '#fdf5f3',
                    100: '#fbe8e5',
                    200: '#f8d5cf',
                    300: '#f2b8ad',
                    400: '#e88f7e',
                    500: '#da6b55',
                    600: '#c65039',
                    700: '#a6402c',
                    800: '#8b4736',
                    900: '#693629',
                    920: '#532b21',
                    950: '#361c15',
                },
            },
        },
    },
    plugins: [],
};
