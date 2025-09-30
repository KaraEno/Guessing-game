import { useEffect } from "react";
import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [score, setScore] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState("");
  const [user, setUser] = useState("");
  const [players, setPlayers] = useState([]);
  const [text, setText] = useState("");
  const [joined, setJoined] = useState(false);
  const [userId, setUserId] = useState("");
  const [gmQuestion, setGmQuestion] = useState("");
  const [gmAnswer, setGmAnswer] = useState("");
  const [selfMessages, setSelfMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showNotice, setShowNotice] = useState("");

  useEffect(() => {
    if (!joined) return;
    const ws = new WebSocket("ws://guessing-game-api.pipeops.net/");

    ws.onopen = () => {
      console.log("connected successfully");
      ws.send(JSON.stringify({ type: "join", sender: user }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Data here", data);
      if (data.type === "system") {
        if (data.category === "all") {
          setMessages((prev) => [...prev, data]);
        } else {
          setSelfMessages((prev) => [...prev, data]);
        }
      } else if (data.type === "scoreboard") {
        setScore(data.scores);
        console.log("Score", score);
      } else if (data.type === "error") {
        if (data.category === "join") {
          setJoined(false);
        }
        setError(data.notice);
      } else if (data.type === "joined") {
        setPlayers((prev) => [...prev, data.user]);
      } else if (data.type === "players") {
        setPlayers(data.players);
      } else if (data.type === "self") {
        setUserId(data.userID);
      } else if (data.type === "question") {
        setQuestion(data.notice);
      } else if (data.type === "start") {
        setShowNotice(data.notice);
        setTimeLeft(data.time);
      } else if (data.type === "roundEnded") {
        setTimeLeft(0);
      }
    };
    ws.onclose = () => {
      console.log("Disconnected from Web socket");
    };
    setSocket(ws);
    return () => ws.close();
  }, [joined, user]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  useEffect(() => {
    if (showNotice) {
      const timer = setTimeout(() => {
        setShowNotice("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotice, setShowNotice]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  if (!joined) {
    return (
      <div className="h-screen w-full p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full sm:w-[40%] my-6 mx-auto mt-4">
            <p>{error}</p>
          </div>
        )}
        <div className="rounded-xl border border-gray-300 rounded  h-[40%] mx-auto w-full sm:w-[40%] p-4 shadow-lg">
          <h2 className="font-bold text-[20px] text-center p-6">
            Guessing Game
          </h2>

          <p>Enter your name</p>
          <input
            type="text"
            value={user}
            placeholder="Alice"
            onChange={(e) => setUser(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setJoined(true);
            }}
            disabled={!user.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition mt-10"
          >
            Join
          </button>
        </div>
      </div>
    );
  }
  const gm = players.find((p) => p.role === "GM");
  const myPlayer = players.find((p) => p.userId === userId);
  const isGM = myPlayer?.role === "GM";
  return (
    <div className="h-screen w-full px-6">
      <div>
        <h2 className="font-bold text-[20px] text-center p-6">Guessing Game</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full sm:w-[40%] my-6 mx-auto mt-4">
            <p>{error}</p>
          </div>
        )}
        {showNotice && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative w-full sm:w-[40%] my-6 mx-auto mt-4">
            <p>{showNotice}</p>
          </div>
        )}
        {timeLeft > 0 && (
          <div className="mx-auto my-3 w-fit px-4 py-2 rounded-lg bg-gray-100 shadow-md">
            <p className="font-bold text-gray-700 text-center">
              Time Left: <span className="text-red-500">{timeLeft}s</span>
            </p>
          </div>
        )}
        <div>
          {question && (
            <div className="mx-auto my-6 w-full sm:w-[60%] lg:w-[40%] rounded-2xl p-6 shadow-xl">
              <h4 className="text-red-700 font-semibold text-lg mb-2 flex items-center gap-2">
                Question
              </h4>
              <p className="text-gray-800 text-base leading-relaxed">
                {question}
              </p>
            </div>
          )}
        </div>
        {selfMessages.length > 0 && (
          <div className="rounded-xl mx-auto w-full sm:w-[40%] p-4 my-4 shadow-lg">
            <h4 className="font-bold mb-2">Instructions</h4>
            <ol className="list-decimal list-inside space-y-1">
              {selfMessages.map((msg, i) => (
                <li className="text-gray-600" key={i}>
                  {msg.notice}
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isGM && (
          <div className="rounded-xl rounded  mx-auto w-full sm:w-[40%] p-4 shadow-lg">
            <input
              type="text"
              value={text}
              placeholder="Type you answer..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition mt-10"
              onClick={() => {
                if (socket && text.trim()) {
                  socket.send(JSON.stringify({ type: "answer", guess: text }));
                  setText("");
                }
              }}
            >
              Send Message
            </button>
          </div>
        )}
        <div>
          {messages.length > 0 && (
            <div className="my-4 mx-auto w-full sm:w-[40%] rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 text-lg">
                  Notifications
                </h4>
                <span className="text-xs text-gray-500">
                  {messages.length} new
                </span>
              </div>

              <div className="space-y-2">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    {msg.notice}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {gm && gm.userId === userId && (
          <div className="rounded-xl my-4 rounded mx-auto w-full sm:w-[40%] p-4 shadow-lg">
            <h4 className=" font-semibold text-lg mb-2 flex items-center gap-2">
              Game Master Board
            </h4>
            <label>Type your question</label>
            <input
              value={gmQuestion}
              className="w-full my-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setGmQuestion(e.target.value)}
            />
            <label>Type your answer</label>
            <input
              value={gmAnswer}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setGmAnswer(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition mt-10"
                onClick={() => {
                  if (socket && gmQuestion.trim() && gmAnswer.trim()) {
                    socket.send(
                      JSON.stringify({
                        type: "setQuestion",
                        question: gmQuestion,
                        answer: gmAnswer,
                      })
                    );
                  }
                }}
              >
                Send Question
              </button>
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition mt-10"
                onClick={() => {
                  if (socket && gmQuestion.trim() && gmAnswer.trim()) {
                    socket.send(
                      JSON.stringify({
                        type: "startRound",
                      })
                    );
                  }
                }}
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="my-6">
        {score && (
          <div className="mx-auto w-full sm:w-[60%] lg:w-[40%] rounded-2xl p-6 shadow-xl border border-purple-200">
            <h2 className="font-bold text-2xl text-center text-blue-500 mb-4">
              Scoreboard
            </h2>
            <ul className="divide-y divide-gray-200">
              {score.map((s, i) => (
                <li
                  key={s.name}
                  className="flex justify-between py-3 px-2 hover:bg-blue-100 rounded-lg transition"
                >
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="font-bold text-gray-900">{s.score}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
