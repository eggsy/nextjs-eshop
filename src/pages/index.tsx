import axios from "axios";

// Hooks
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import useSWR from "swr";

// Components
import InfiniteScroll from "react-infinite-scroll-component";
import GameCard from "../components/GameCard";
import Loader from "../components/Loader";

// Types
import type { NextPage } from "next";
import type { GameEuResult } from "./api/getGames";

// Fetcher
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Component
const Home: NextPage = () => {
  const [input, setInput] = useState("");
  const [sortBy, setSort] = useState("name-up");

  const debouncedInput = useDebounce(input, 300);

  const [games, setGames] = useState<GameEuResult[]>([]);
  const [limit, setLimit] = useState(100);

  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { mutate } = useSWR<GameEuResult[]>(
    `/api/getGames?limit=${limit}`,
    fetcher,
    {
      onSuccess: (data) => {
        setGames(data);
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message);
        setLoading(false);
      },
    }
  );

  const getSortedGames = useMemo(() => {
    const sortedGames = [...games];

    if (sortBy === "popularity-up") {
      sortedGames.sort((a, b) => a.popularity - b.popularity);
    } else if (sortBy === "popularity-down") {
      sortedGames.sort((a, b) => b.popularity - a.popularity);
    } else if (sortBy === "name-up") {
      sortedGames.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-down") {
      sortedGames.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "price-up") {
      sortedGames.sort((a, b) => a.price.discount - b.price.discount);
    } else if (sortBy === "price-down") {
      sortedGames.sort((a, b) => b.price.discount - a.price.discount);
    }

    return sortedGames;
  }, [games, sortBy]);

  const getFilteredGames = useMemo(() => {
    if (!debouncedInput) return getSortedGames;
    const lowerCaseInput = debouncedInput[0].toLowerCase();

    return getSortedGames.filter((game) =>
      game.name.toLowerCase().includes(lowerCaseInput)
    );
  }, [getSortedGames, debouncedInput]);

  const handleNext = () => {
    setLimit((prev) => prev + 100);
    mutate();
  };

  if (isLoading) return <Loader />;
  else if (error) return <div>Error</div>;
  else
    return (
      <>
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <input
            className="w-full px-4 py-2 placeholder-gray-300 rounded-md outline-none appearance-none md:w-3/5 bg-gray-400/50"
            onChange={(event) => setInput(event.target.value)}
            value={input}
            placeholder="Filter results"
          />

          <div className="flex items-center justify-between w-full space-x-10 md:w-max md:space-x-2">
            <span className="flex-shrink-0">Sort By:</span>

            <select
              className="w-full px-4 py-2 text-center rounded-md appearance-none bg-gray-400/50 focus:outline-none"
              onChange={(event) => setSort(event.target.value)}
              value={sortBy}
            >
              <option value="name-up">Name ⬆️</option>
              <option value="name-down">Name ⬇️</option>
              <option value="popularity-up">Popularity ⬆️</option>
              <option value="popularity-down">Popularity ⬇️</option>
              <option value="price-up">Price ⬆️</option>
              <option value="price-down">Price ⬇️</option>
            </select>
          </div>
        </div>

        <InfiniteScroll
          className="grid gap-4 md:grid-cols-2"
          dataLength={getFilteredGames.length}
          hasMore={getFilteredGames.length > 0}
          loader={<p className="text-center md:col-span-2">Loading...</p>}
          endMessage={
            <p className="text-center md:col-span-2">No more results found.</p>
          }
          next={handleNext}
        >
          {getFilteredGames.map((game, index) => (
            <GameCard key={game.name + index} game={game} />
          ))}
        </InfiniteScroll>
      </>
    );
};

export default Home;
