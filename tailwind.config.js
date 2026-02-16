/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'kku-gold': '#F06C00', // สีทอง มข.
                'kku-maroon': '#EBA942', // สีแดงเลือดหมู มข.
            },
        },
    },
    plugins: [],
}