import { useState, useEffect } from "react";
import axios from "../axios";

const base_url = "https://image.tmdb.org/t/p/original/";

function Row({ title, fetchUrl, isLargeRow = false }) {
    const [movies, setMovies] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Ensure fetchUrl is valid before making request
                if (!fetchUrl) {
                    console.error("fetchUrl is missing for Row:", title);
                    return;
                }
                const request = await axios.get(fetchUrl);
                console.log(`Row [${title}] fetchUrl: ${fetchUrl}`, request.data.results);
                setMovies(request.data.results);
                return request;
            } catch (error) {
                console.error(`Row [${title}] error:`, error);
                setError(error.message);
            }
        }

        fetchData();
    }, [fetchUrl, title]);

    if (error) {
        return (
            <div className="row">
                <h2>{title}</h2>
                <p style={{ color: 'red', padding: '20px' }}>Error loading movies: {error}</p>
            </div>
        );
    }

    if (!movies || movies.length === 0) {
        return (
            <div className="row">
                <h2>{title}</h2>
                <p style={{ color: '#fff', padding: '20px' }}>Loading or no movies found...</p>
            </div>
        );
    }

    return (
        <div className="row">
            <h2>{title}</h2>

            <div className="row_posters">
                {movies.map(
                    (movie) =>
                        ((isLargeRow && movie.poster_path) ||
                            (!isLargeRow && movie.backdrop_path)) && (
                            <img
                                className={`row_poster ${isLargeRow && "row_posterLarge"}`}
                                key={movie.id}
                                src={`${base_url}${isLargeRow ? movie.poster_path : movie.backdrop_path
                                    }`} alt={movie.name} />
                        )
                )}
            </div>
        </div>
    )
}

export default Row
