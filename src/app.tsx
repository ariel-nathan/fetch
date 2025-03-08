import { useMutation, useQuery } from "@tanstack/react-query";
import { DogIcon, Heart, SortAsc, SortDesc } from "lucide-react";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { toast } from "sonner";
import LoginForm from "./components/login-form";
import LogoutButton from "./components/logout-button";
import { MultiSelect } from "./components/muli-select";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Slider } from "./components/ui/slider";
import { COOKIES } from "./consts";
import { api, getDogs, searchDogs } from "./lib/api";
import { Dog } from "./types";

export default function App() {
  const [cookies] = useCookies([COOKIES.AUTHED]);
  const [search, setSearch] = useState("");
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState<number | undefined>();
  const [ageMax, setAgeMax] = useState<number | undefined>();
  const [sortField, setSortField] = useState<string>("breed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentCursor, setCurrentCursor] = useState<string | undefined>();
  const [favorites, setFavorites] = useState<Dog[]>([]);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matchedDog, setMatchedDog] = useState<Dog | null>(null);

  // Combine sort field and direction
  const sort = `${sortField}:${sortDirection}`;

  const breeds = useQuery({
    queryKey: ["breeds"],
    queryFn: async () => {
      const res = await api.get("/dogs/breeds");
      return res.data as string[];
    },
    enabled: !!cookies[COOKIES.AUTHED],
  });

  const { data: searchResults, error: searchError } = useQuery({
    queryKey: ["dogs", selectedBreeds, ageMin, ageMax, sort, currentCursor],
    queryFn: () =>
      searchDogs({
        breeds: selectedBreeds.length > 0 ? selectedBreeds : undefined,
        ageMin: ageMin,
        ageMax: ageMax,
        sort,
        from: currentCursor ? parseInt(currentCursor, 10) : undefined,
        size: 25,
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

  // Match mutation
  const matchMutation = useMutation({
    mutationFn: async (dogIds: string[]) => {
      const { data } = await api.post("/dogs/match", dogIds);
      return data.match as string;
    },
    onSuccess: async (matchId) => {
      // Get the matched dog details
      const matchedDogData = await getDogs([matchId]);
      if (matchedDogData.length > 0) {
        setMatchedDog(matchedDogData[0]);
        setMatchDialogOpen(true);
      }
    },
    onError: (error) => {
      toast.error("Failed to find a match");
      console.error("Match error:", error);
    },
  });

  // Handle pagination
  const handleNextPage = () => {
    if (searchResults?.next) {
      // Extract cursor from next URL
      const nextCursor = new URLSearchParams(
        searchResults.next.split("?")[1]
      ).get("from");
      setCurrentCursor(nextCursor || undefined);
    }
  };

  const handlePrevPage = () => {
    if (searchResults?.prev) {
      // Extract cursor from prev URL
      const prevCursor = new URLSearchParams(
        searchResults.prev.split("?")[1]
      ).get("from");
      setCurrentCursor(prevCursor || undefined);
    }
  };

  // Toggle favorite
  const toggleFavorite = (dog: Dog) => {
    setFavorites((prev) => {
      const isFavorite = prev.some((favDog) => favDog.id === dog.id);
      if (isFavorite) {
        return prev.filter((favDog) => favDog.id !== dog.id);
      } else {
        return [...prev, dog];
      }
    });
  };

  // Generate match
  const generateMatch = () => {
    if (favorites.length === 0) {
      toast.error("Please add at least one dog to your favorites");
      return;
    }

    const favoriteIds = favorites.map((dog) => dog.id);
    matchMutation.mutate(favoriteIds);
  };

  // Filter dogs by search term
  const filteredDogs = dogs?.filter(
    (dog) =>
      search === "" ||
      dog.name.toLowerCase().includes(search.toLowerCase()) ||
      dog.breed.toLowerCase().includes(search.toLowerCase()) ||
      dog.zip_code.includes(search)
  );

  // Reset cursor when filters change
  useEffect(() => {
    setCurrentCursor(undefined);
  }, [selectedBreeds, ageMin, ageMax, sort]);

  if (!cookies[COOKIES.AUTHED]) {
    return <LoginForm />;
  }

  return (
    <div className="grow flex flex-col min-h-screen">
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="container flex justify-between items-center h-14">
          <div className="flex items-center gap-2">
            <DogIcon className="size-12" />
            <h1 className="text-xl font-semibold">PupFinder</h1>
          </div>
          <div className="flex items-center gap-4">
            {favorites.length > 0 && (
              <Button
                variant="outline"
                onClick={generateMatch}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4 fill-current" />
                <span>Match ({favorites.length})</span>
              </Button>
            )}
            <div className="flex items-center gap-2">
              {!!cookies[COOKIES.AUTHED] &&
                "Hello, " + cookies[COOKIES.AUTHED].name}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="container grow flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg">
          <div className="flex gap-4 flex-wrap">
            <Input
              type="text"
              placeholder="Search by name, breed, or zip code..."
              className="h-10 flex-1 min-w-[300px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <MultiSelect
              className="flex-1 min-w-[300px]"
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

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <Label>
                Age Range: {ageMin || 0} - {ageMax || 20}+ years
              </Label>
              <div className="flex gap-4 items-center mt-2">
                <Input
                  type="number"
                  min={0}
                  max={ageMax || 20}
                  value={ageMin || 0}
                  onChange={(e) =>
                    setAgeMin(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-20"
                />
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={[ageMin || 0, ageMax || 20]}
                  onValueChange={(values) => {
                    setAgeMin(values[0]);
                    setAgeMax(values[1]);
                  }}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={ageMin || 0}
                  max={20}
                  value={ageMax || 20}
                  onChange={(e) =>
                    setAgeMax(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex gap-2 items-end flex-1 min-w-[300px]">
              <div className="flex-1">
                <Label>Sort By</Label>
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breed">Breed</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
                className="mb-0.5"
              >
                {sortDirection === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">
              Your Favorites ({favorites.length})
            </h2>
            <div className="flex gap-2 flex-wrap">
              {favorites.map((dog) => (
                <Badge
                  key={dog.id}
                  variant="secondary"
                  className="flex items-center gap-1 p-1 pl-2"
                >
                  {dog.name} ({dog.breed})
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-slate-200 rounded-full"
                    onClick={() => toggleFavorite(dog)}
                  >
                    <span className="sr-only">Remove</span>×
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {dogsLoading && (
            <div className="col-span-full text-center py-8">
              Loading dogs...
            </div>
          )}
          {dogsError && (
            <div className="col-span-full text-center py-8 text-red-500">
              Error: {dogsError.message}
            </div>
          )}
          {filteredDogs?.length === 0 && (
            <div className="col-span-full text-center py-8">
              No dogs found matching your criteria.
            </div>
          )}
          {filteredDogs &&
            filteredDogs.map((dog) => (
              <Card
                key={dog.id}
                className="overflow-hidden flex flex-col h-full"
              >
                <CardHeader className="p-0 overflow-hidden">
                  <img
                    src={dog.img}
                    alt={dog.name}
                    className="object-cover aspect-square w-full"
                  />
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{dog.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(dog)}
                      className="h-8 w-8 -mr-2 -mt-2"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          favorites.some((f) => f.id === dog.id)
                            ? "fill-red-500 text-red-500"
                            : ""
                        }`}
                      />
                      <span className="sr-only">
                        {favorites.some((f) => f.id === dog.id)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                      </span>
                    </Button>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Breed:</span> {dog.breed}
                    </p>
                    <p>
                      <span className="font-medium">Age:</span> {dog.age}{" "}
                      {dog.age === 1 ? "year" : "years"}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {dog.zip_code}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => toggleFavorite(dog)}
                  >
                    {favorites.some((f) => f.id === dog.id)
                      ? "Remove from Favorites"
                      : "Add to Favorites"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
        </div>

        {searchResults && (
          <div className="flex justify-between items-center mt-4">
            <div>
              Showing {filteredDogs?.length || 0} of {searchResults.total} dogs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!searchResults.prev}
                onClick={handlePrevPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!searchResults.next}
                onClick={handleNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              You've been matched with {matchedDog?.name}!
            </DialogTitle>
          </DialogHeader>

          {matchedDog && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={matchedDog.img}
                alt={matchedDog.name}
                className="rounded-lg max-h-[300px] object-cover"
              />
              <div className="text-center">
                <h3 className="font-semibold text-xl">{matchedDog.name}</h3>
                <p>{matchedDog.breed}</p>
                <p>
                  {matchedDog.age} {matchedDog.age === 1 ? "year" : "years"} old
                </p>
                <p>Location: {matchedDog.zip_code}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setMatchDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
