import { useState, useEffect } from "react";
import { getHighscore, uploadHighscore } from "./firebase_firestore";

function Highscore() {
  const [currentHighscore, setCurrentHighscore] = useState(0);

  const getData = async () => {
    const result = await getHighscore();
    setCurrentHighscore(result);
  };

  useEffect(() => {
    getData();
  }, []);

  const handleFormSubmission = async (event) => {
    event.preventDefault();
    const result = await uploadHighscore(event.target.newScore.value);
    setCurrentHighscore(event.target.newScore.value);
  };

  return (
    <div>
      <h3>Current Highscore: {currentHighscore}</h3>

      <form onSubmit={handleFormSubmission}>
        <input type="number" id="newScore" placeholder={0} />
        <button type="Submit">Add new score!</button>
      </form>
    </div>
  );
}

export default Highscore;
