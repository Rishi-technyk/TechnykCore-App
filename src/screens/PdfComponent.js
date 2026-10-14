import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import Header from "../components/Header";
import { useAppTheme } from "../theme/AppThemeProvider";
import { useSelector } from "react-redux";

const PDFComponent = (props) => {
  const [loading, setLoading] = useState(true);
  const { colors } = useAppTheme();
  const {token}=useSelector(state=>state.auth)
  const styles = createStyles(colors);
  const { route } = props;
  console.log( route, '---------------------- token ---------------------');
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingInner}>
            <ActivityIndicator
              size="large"
              color={colors.secondary}
              animating={loading}
            />
          </View>
        </View>
      )}
      <Header title={route?.params?.name?route.params.name:"Invoice"} />

      <Pdf
      
        enablePaging={false}
        trustAllCerts={false}
        source={{ uri: route.params.url ,  headers: {
      Authorization: `Bearer ${token}`,
    },}}
        scale={1.0} // Force default scale
        minScale={1.0}
        maxScale={3.0}
        fitPolicy={2} // 0 = fit width, 1 = fit height, 2 = fit both
        onLoadComplete={(numberOfPages, filePath) => {
          setLoading(false);
        }}
        onPageChanged={(page, numberOfPages) => {}}
        onError={(error) => {
          console.log("PDF Error:", error);
          setLoading(false);
        }}
        
        onPressLink={(uri) => {}}
        style={styles.pdf}
      />
    </View>
  );
};

export default PDFComponent;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingOverlay: {
      backgroundColor: colors.overlay,
      flex: 1,
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    loadingInner: {
      backgroundColor: "transparent",
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    pdf: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.background,
    },
  });
