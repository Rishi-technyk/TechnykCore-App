import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import Share from "react-native-share";
import { useRoute } from "@react-navigation/native";
import { javascriptGet } from "../../util/api";
import { DOMAIN, ENDPOINT} from "../../util/constant";
import { useSelector } from "react-redux";
import TicketQRShimmer from "../../components/TicketQRShimmer";
import { SvgXml } from "react-native-svg";
import { FlatList } from "react-native-gesture-handler";
import moment from "moment";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONT_FAMILY, } from "../../util/colors";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../../navigation/AppDrawer";
import { generatePDF } from "react-native-html-to-pdf";

const { width, height } = Dimensions.get("window");
type Props=NativeStackScreenProps<AppStackParamList,'EventPasses'>
const  EventPasses:React.FC<Props> = ({ navigation }) => {
  const route = useRoute<any>();
  const { bookingId } = route.params;
  const userData = useSelector((s: any) => s.auth);

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [booking, setBooking] = useState(null);

  const fetchDetails = async () => {
    const res = await javascriptGet({
      path: `${ENDPOINT.event_booking_detail}/${bookingId}`,
      Token: userData?.token,
    });

    if (res?.status) {
   
      setParticipants(res.participants);
      setBooking(res.booking);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, []);
const generatePDF1 = async (item: any): Promise<void> => {
  try {
    if (!item || !booking) return;

    const LOGO = DOMAIN.ICON_URL;
    const bg = DOMAIN.IMG+'passes/'+ item.image_background;

    const html = `
    <html>
    <head>
      <style>
        @page { margin: 0; width: 420px;
  height: 800px;}

  body {
  margin: 0;
  padding: 0;
  width: 420px;
  height: 780px;
  font-family: Helvetica, Arial, sans-serif;
  background: #f4f4f4;
  display: block;
}

.ticket {
  width: 400px;        /* smaller than page width to stay centered */
  height: 100%;        /* full page height */
  margin: 0 auto;      /* horizontal center */
  border-radius: 16px;
  overflow: hidden;
  background-image: url('${bg}');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 20px;
  color: white;
  text-align: center;
}
  .overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45); /* adjust 0.3 – 0.6 */
}
  .content {
  position: relative;
  z-index: 2;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  text-align: center;
}
        .top {
          margin-top: 10px;
        }

        .logo {
          width: 60px;
          height: 60px;
          margin-bottom: 8px;
        }

        .club-name {
          font-size: 20px;
          font-weight: bold;
        }

        .subheading {
          font-size: 13px;
          margin-top: 2px;
          opacity: 0.9;
        }

        .event-title {
          font-size: 18px;
          font-weight: bold;
          margin-top: 20px;
        }

        .event-date {
          font-size: 13px;
          margin-top: 6px;
        }

        .pass-type {
          margin-top: 12px;
          font-size: 14px;
          letter-spacing: 2px;
          font-weight: bold;
        }

        .middle {
          margin-top: 0px;
        }

        .qr-box {
          background: white;
          padding: 12px;
          border-radius: 12px;
          display: inline-block;
        }

        .qr {
          width: 170px;
          height: 170px;
        }

        .bottom {
          margin-bottom: 0px;
        }

        .info {
          font-size: 13px;
          margin-top: 6px;
        }

      </style>
    </head>

    <body>
      <div class="ticket">
  <div class="overlay"></div>
    <div class="content">
        <div class="top">
          <img src="${LOGO}" class="logo" />
          <div class="club-name">${booking.formate.heading}</div>
          <div class="subheading">${booking.formate.subheading}</div>

          <div class="event-title">${booking.event_name}</div>
          <div class="event-date">
            ${moment(booking.event_date).format("ddd MMM DD YYYY • h:mm A")}
          </div>

          <div class="pass-type">
            ${
              item.ticket_type.toUpperCase() === "VIP"
                ? "SPECIAL INVITEE"
                : item.ticket_type.toUpperCase()
            } PASS
          </div>

          ${
            item.ticket_type.toUpperCase() !== "VIP"
              ? `<div class="event-date">${item.title ?? ""}</div>`
              : ""
          }
        </div>

        <div class="middle">
          <div class="qr-box">
            <img src="data:image/svg+xml;base64,${item.qr_code}" class="qr" />
          </div>
        </div>

        <div class="bottom">
         

          <div class="info">${booking.booking_no}-${item.id}</div>

          <div class="info">
            Member: ${
              item.ticket_type.toUpperCase() === "VIP"
                ? "Special Invitee"
                : booking.memberId ?? ""
            }
          </div>
 <div class="info">
            ${
              Number(item.is_complimentary) === 1 &&
              ["MEMBER", "SPOUSE"].includes(item.ticket_type.toUpperCase())
                ? booking.formate.complimentary_footer1
                : booking.formate.footer1
            }
          </div>
          <div class="info">${booking.formate.footer2}</div>
          <div class="info">${booking.formate.footer3}</div>
        </div>
        ${booking.seats.length && booking.seats.map((s: any) => `<div class="info">Seat: ${s.seat_code}</div>`).join("")}
  </div>
      </div>
    </body>
    </html>
    `;

    return await generatePDF({
      html,
      fileName: `event_pass_${bookingId}_${item.id}`,
      base64: false,
    });

  } catch (error) {
    console.log(error, "PDF ERROR");
    Alert.alert("Unable to create PDF.");
  }
};

  
  const shareTicket = async (item:any):Promise<void> => {
    try {
      
      const file =await  generatePDF1(item);
     
     
      await Share.open({
        title: "Event Tickets",
        message: "Here are the event tickets",
        url: `file://${file.filePath}`, 
        type: "application/pdf",
      });
    } catch (e) {
      console.log("Share error", e);
    }
  };
  const TicketItem = ({ item, booking }) => {
    const ref = useRef(null);


console.log(item.qr_code , '----------------------  ---------------------');
    return (
      <View style={{ width, height }}>

        <TouchableOpacity onPress={()=>shareTicket(item)} style={styles.shareBtn}>
          <Icon name="share" size={22} color="#fff" />
        </TouchableOpacity>
        <View
          ref={ref}
       
          style={{ flex: 1 }}
        >
          <ImageBackground
            source={{ uri: DOMAIN.IMG+'passes/'+ item.image_background }}
            style={styles.card}
            imageStyle={styles.bgImage}
          >
             <View style={styles.overlay} />
            <View style={styles.qrBox}>
                <Image
                  source={require("../../../assets/images/Logo.png")}
                  style={{ width: 50, height: 50 }}
                />
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.clubTitle}>{booking.formate.heading}</Text>
              </View>

              <Text style={styles.eventDateSmall}>
                {booking.formate.subheading}
              </Text>

              <Text style={styles.eventName}>{booking.event_name}</Text>

              <Text style={styles.eventDate}>
                on{" "}
                {moment(booking.event_date).format(
                  "ddd MMM DD YYYY [at] h.m A"
                )}
              </Text>

              <Text style={styles.passType}>
                {item.ticket_type.toUpperCase() === "VIP"
                  ? "Special Invitee"
                  : item.ticket_type.toUpperCase()}{" "}
                PASS
              </Text>{item.ticket_type.toUpperCase() !== "VIP" && (
                <Text style={styles.eventDateSmall}>{item.title}</Text>
              )}
            </View>
            <View style={styles.qrBox}>
              <View style={styles.qrWhiteBox}>
            <SvgXml xml={atob(item.qr_code)} width={220} height={220} />
              </View>
            </View>

            <Text style={styles.name}>
              Member:{" "}
              {item.ticket_type.toUpperCase() === "VIP"
                ? "Special Invitee"
                : booking.memberId}
            </Text>
            
            <Text style={styles.name}>{Number(item.is_complimentary)=== 1  && (item.ticket_type.toUpperCase() ==="MEMBER"||item.ticket_type.toUpperCase() ==='SPOUSE') ? booking.formate.complimentary_footer1 :booking.formate.footer1 }</Text>

            <Text style={styles.name}>
              {booking.booking_no}-{item.id}
            </Text>
            <Text style={styles.name}>
              {booking.formate.footer2}
            </Text>
            <Text style={styles.name}>
              {booking.formate.footer3}
            </Text>
            {booking.seats.length > 0 && (
              <View>
                <Text style={styles.name}>
                  Seat: {booking.seats.map((s: any) => s.seat_code).join(", ")}
                </Text>
              </View>
            )}
            <Text style={styles.footer}>Swipe → for next ticket</Text>
            <View/>
          </ImageBackground>
        </View>
      </View>
    );
  };

  // --------------------------
  // MAIN RETURN
  // --------------------------
  return (
    <View style={{ flex: 1 }}>
 
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.shareBtn, { top: 10, left: 10, width: 20, height: 20 }]}
      >
        <Icon name="chevron-left" size={20} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={loading ? [1] : participants}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) =>
        loading ? (
          <View style={{ width, height, alignItems: "center", justifyContent: "center",backgroundColor:'white' }}>
            <TicketQRShimmer />
            </View>
          ) : (
            <TicketItem item={item} booking={booking} />
          )
        }
      />
    </View>
  );
}
export default EventPasses;
// --------------------------
// ⭐ STYLES
// --------------------------
const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  bgImage: { resizeMode: "cover" },
  clubTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 30,
    color: "white",
    marginLeft: 10,
  },
  overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0,0,0,0.4)", // adjust 0.3 - 0.6
},
  eventName: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    color: "#fff",
    marginTop: 20,
  },
  eventDate: { fontSize: 13, color: "#e5e7eb", marginTop: 4 },
  eventDateSmall: { fontSize: 12, color: "#e5e7eb", marginTop: 2 },
  passType: {
    marginTop: 10,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 2,
    color: "#fff",
  },
  qrBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  qrWhiteBox: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
  },
  name: {
    textAlign: "center",
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: "#fff",
  },
  footer: { textAlign: "center", color: "#e5e7eb", fontSize: 12, marginBottom: 30 },
  shareBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});