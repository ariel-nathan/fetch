import { useQuery } from "@tanstack/react-query";
import { DogIcon } from "lucide-react";
import { useState } from "react";
import { useCookies } from "react-cookie";
import LoginForm from "./components/login-form";
import LogoutButton from "./components/logout-button";
import { MultiSelect } from "./components/muli-select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { COOKIES } from "./consts";
import { api, getDogs, searchDogs } from "./lib/api";

export default function App() {
  const [cookies] = useCookies([COOKIES.AUTHED]);
  const [search, setSearch] = useState("");
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState<number | undefined>();
  const [ageMax, setAgeMax] = useState<number | undefined>();
  const [sort, setSort] = useState<string | undefined>();
  const [page, setPage] = useState<number | undefined>();

  const breeds = useQuery({
    queryKey: ["breeds"],
    queryFn: async () => {
      const res = await api.get("/dogs/breeds");
      return res.data as string[];
    },
    enabled: !!cookies[COOKIES.AUTHED],
  });

  const { data: searchResults, error: searchError } = useQuery({
    queryKey: ["dogs", selectedBreeds, ageMin, ageMax, sort, page],
    queryFn: () =>
      searchDogs({
        breeds: selectedBreeds.length > 0 ? selectedBreeds : undefined,
        ageMin: ageMin ? ageMin : undefined,
        ageMax: ageMax ? ageMax : undefined,
        sort,
        from: page,
      }),
    enabled: !!cookies[COOKIES.AUTHED],
  });

  const {
    data: dogs,
    isLoading: dogsLoading,
    error: dogsError,
  } = useQuery({
    queryKey: ["dogDetails", searchResults?.resultIds],
    queryFn: () =>
      searchResults?.resultIds
        ? getDogs(searchResults.resultIds)
        : Promise.resolve([]),
    enabled:
      !!searchResults?.resultIds && !!cookies[COOKIES.AUTHED] && !searchError,
  });

  if (!!!cookies[COOKIES.AUTHED]) {
    return <LoginForm />;
  }

  return (
    <div className="grow flex flex-col">
      <header className="border-b">
        <div className="container flex justify-between items-center h-14">
          <div className="flex items-center gap-2">
            <DogIcon className="size-12" />
            <h1 className="text-xl font-semibold">PupFinder</h1>
          </div>
          <div className="flex items-center gap-2">
            {!!cookies[COOKIES.AUTHED] &&
              "Hello, " + cookies[COOKIES.AUTHED].name}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container grow flex flex-col gap-4 p-4">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search..."
            className="h-10 w-2/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <MultiSelect
            className="w-1/3"
            options={
              breeds.data?.map((breed) => ({
                label: breed,
                value: breed,
              })) || []
            }
            placeholder={"Select breeds..."}
            onValueChange={setSelectedBreeds}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 place-items-center">
          {dogsLoading && <div>Loading...</div>}
          {dogsError && <div>Error: {dogsError.message}</div>}
          {dogs?.length === 0 && <div>No dogs found.</div>}
          {dogs &&
            dogs.map((dog) => (
              <Card
                key={dog.id}
                className="max-w-3xs p-0 gap-2 overflow-hidden"
              >
                <CardHeader className="p-0 overflow-hidden">
                  <img
                    src={dog.img}
                    alt={dog.name}
                    className="object-cover aspect-square"
                  />
                </CardHeader>
                <CardContent className="p-2">
                  <p>{dog.name}</p>
                  <p>{dog.breed}</p>
                  <p>{dog.age}</p>
                  <p>{dog.zip_code}</p>
                </CardContent>
                <CardFooter></CardFooter>
              </Card>
            ))}
        </div>
      </main>
    </div>
  );
}
