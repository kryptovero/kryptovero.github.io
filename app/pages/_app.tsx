import "../styles/globals.scss";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

if (process.env.NODE_ENV === "production")
  alert(
    "Hei! Tämä saitti on vielä kehityksen alla ja osa ominaisuuksista ei vielä toimi."
  );
