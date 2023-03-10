// https://for-dummies.net/gas-noobs/how-to-use-oncalendar-change-triggers-for-gas/

const properties = PropertiesService.getUserProperties();

const getSync = async () => {
  const calendarId = "primary";
  const syncToken = properties.getProperty("nextSyncToken");
  const options = {
    singleEvents: true,
    syncToken: syncToken
  };

  // Google Calendar APIを用いて予定の一覧を取得する
  try {
    events = await Calendar.Events.list(calendarId, options);
  } catch (e) {
    throw e;
  }

  if (events.items && events.items.length === 0) {
    console.info("予定が見つかりませんでした");
    return;
  }

  // 前回のCalendar.Events.list()実行時との予定一覧のうち、更新されたもののみの一覧が取得できる
  console.log(events.items[0]);
  
  properties.setProperty("nextSyncToken", events.nextSyncToken);

  try {
    if (events.items[0].status === "confirmed") {
      await postToTimeTree(events.items[0]);     
    }
  } catch (e) {
    throw e;
  } finally {
    console.log("end");
  }
}

// https://developers.timetreeapp.com/ja/docs/api/oauth-app#create-an-event
const postToTimeTree = async (event) => {
  const properties = PropertiesService.getUserProperties();
  const accessToken = properties.getProperty("accessToken");
  const calendarId = properties.getProperty("calendarId");
  const endPoint = `https://timetreeapis.com/calendars/${calendarId}/events`;
  
  const body = {
    data: {
      attributes: {
        category: "schedule",
        title: event.summary,
        // all_day: date形式でなくdateTime形式ならば、終日ではない
        all_day: event.start.dateTime ? false : true, 
        // start_at: date形式でなくdateTime形式ならば、日時を返す
        start_at: event.start.dateTime ? event.start.dateTime : event.start.date, 
        // end_at: date形式でなくdateTime形式ならば、日時を返す。Sカレンダーの仕様上終日の場合1日遅れるので（e.g. 3/1で終日登録 => end at dateは3/2）1日戻してリターンする
        end_at: event.end.dateTime ? event.end.dateTime : getBeforeOneDate(event.end.date), 
      },
      relationships: {
        label: {
          data: {
            id: "1",
            type: "label"
          }
        }
      }
    }
  };
  const options = {
    method : "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    payload : JSON.stringify(body)
  };

  try {
    res = await UrlFetchApp.fetch(endPoint, options);
  } catch (e) {
    throw e;
  } finally {
    console.log("end");
  }
}

const getBeforeOneDate = (date) => {
  const dt = new Date(date);
  dt.setDate(dt.getDate() - 1);
  const y = dt.getFullYear();
  const m = `00${dt.getMonth() + 1}`.slice(-2);
  const d = `00${dt.getDate()}`.slice(-2);  
  return (`${y}-${m}-${d}`);
}

const initialSync = async () => {
  let events;
  const calendarId = "primary";
  const options = {
    timeMin: (new Date()).toISOString(),
    singleEvents: true,
  };

  // Google Calendar APIを用いて予定の一覧を取得する
  try {
    events = await Calendar.Events.list(calendarId, options);
  } catch (e) {
    console.warn(e);
  }

  if (events.items && events.items.length === 0) {
    console.info("予定が見つかりませんでした");
    return;
  }

  // 取得できた予定の配列
  console.log(events.items);

  properties.setProperty("nextSyncToken", events.nextSyncToken);
}
