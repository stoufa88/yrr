import { useEffect, useRef, useState } from "react";
import {
  createIcon,
  Box,
  Container,
  Text,
  Stack,
  IconButton,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  Input,
  FormLabel,
  Spinner,
  Image,
  FormHelperText,
} from "@chakra-ui/react";
import Player from "./ui/Player";
import parse from "./lib/parser";
import Nav from "./ui/Nav";
import { SettingsIcon } from "@chakra-ui/icons";

declare const gapi: any;
const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";


const STORAGE_KEY = "tracks";

const DEFAULT_CONFIG: Config = {
  minViews: 100,
  minLikes: 5,
  daysAgo: 8,
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const GoogleAuth = useRef<any>(null);

  useEffect(() => {
    function updateSigninStatus() {
      setSigninStatus();
    }
  
    async function start() {
      // In practice, your app can retrieve one or more discovery documents.
      var discoveryUrl =
        "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest";

      // Initialize the gapi.client object, which app uses to make API requests.
      // Get API key and client ID from API Console.
      // 'scope' field specifies space-delimited list of access scopes.
      await gapi.client.init({
        apiKey: process.env.REACT_APP_API_KEY,
        clientId: process.env.REACT_APP_CLIENT_ID,
        discoveryDocs: [discoveryUrl],
        scope: SCOPE,
      });

      GoogleAuth.current = gapi.auth2.getAuthInstance();

      if (!GoogleAuth.current) {
        return;
      }

      // Listen for sign-in state changes.
      GoogleAuth.current.isSignedIn.listen(updateSigninStatus);

      // Handle initial sign-in state. (Determine if user is already signed in.)
      var user = GoogleAuth.current.currentUser.get();
      setSigninStatus();
      setUser(user);
    }

    gapi.load("client", start);
  }, []);

  function handleAuthClick() {
    if (GoogleAuth.current.isSignedIn.get()) {
      // User is authorized and has clicked "Sign out" button.
      GoogleAuth.current.signOut();
    } else {
      // User is not signed in. Start Google auth flow.
      GoogleAuth.current.signIn();
    }
  }

  function revokeAccess() {
    GoogleAuth.current.disconnect();
  }

  function setSigninStatus() {
    var user = GoogleAuth.current.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    setIsSignedIn(isAuthorized);
  }

  useEffect(() => {
    if (localStorage.getItem("tracks")) {
      setTracks(JSON.parse(localStorage.getItem("tracks") || ""));
    }
  }, []);

  return (
    <>
      <header>
        <Nav
          isSignedIn={isSignedIn}
          imageUrl={
            isSignedIn && user ? user.getBasicProfile().getImageUrl() : null
          }
          onSignin={handleAuthClick}
          onSignout={revokeAccess}
        />
      </header>
      <main>
        <Container marginTop={8} minHeight={96}>
          <Flex alignItems="center" justifyContent="center">
            <Button
              onClick={() => {
                setIsLoading(true);
                parse((tracks: any) => {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
                  setTracks(tracks);
                  setIsLoading(false);
                }, config);
              }}
              disabled={!user}
              colorScheme="blue"
            >
              {!isLoading ? "Start parser" : "Cancel"}
            </Button>

            <IconButton
              aria-label="Open settings"
              icon={<SettingsIcon />}
              variant="ghost"
              size="lg"
              onClick={onOpen}
            />
          </Flex>

          <Box position="fixed" top={16} left={0} width={250}>
            <Player videoId={videoId} />
          </Box>

          {isLoading ? (
            <Box textAlign="center" marginTop={4}>
              <Spinner />
            </Box>
          ) : (
            <Stack spacing={4} marginTop={4}>
              {tracks.map((t: any) => (
                <Feature
                  key={t.id}
                  title={t.snippet.title}
                  channelTitle={t.snippet.channelTitle}
                  thumnailUrl={t.snippet.thumbnails.default.url}
                  isPlaying={t.id === videoId}
                  onPlay={() => setVideoId(t.id)}
                />
              ))}
            </Stack>
          )}
        </Container>
      </main>

      <footer>
        <Box mt={6} p={4} bgColor="gray.800" color="white" textAlign="center">
          Made with Youtube Data API and Chakra UI

        </Box>
      </footer>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Parser Config</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel htmlFor="minViews">Min views</FormLabel>
              <Input
                placeholder="Min views"
                id="minViews"
                value={config.minViews}
                onChange={(e) => {
                  if (isNaN(Number(e.target.value))) {
                    return;
                  }

                  setConfig({ ...config, minViews: Number(e.target.value) });
                }}
              />
              <FormHelperText>Keep videos with at least {config.minViews} views</FormHelperText>
            </FormControl>

            <FormControl marginTop={4}>
              <FormLabel htmlFor="minLikes">Min likes</FormLabel>
              <Input
                placeholder="Min likes"
                value={config.minLikes}
                id="minLikes"
                onChange={(e) => {
                  if (isNaN(Number(e.target.value))) {
                    return;
                  }

                  setConfig({ ...config, minLikes: Number(e.target.value) });
                }}
              />
              <FormHelperText>Keep videos with at least {config.minLikes} likes</FormHelperText>
            </FormControl>

            <FormControl marginTop={4}>
              <FormLabel htmlFor="minViews">Days ago</FormLabel>
              <Input
                placeholder="Days ago"
                value={config.daysAgo}
                onChange={(e) => {
                  if (isNaN(Number(e.target.value))) {
                    return;
                  }

                  setConfig({ ...config, daysAgo: Number(e.target.value) });
                }}
              />
              <FormHelperText>Keep recent videos starting {config.daysAgo}</FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => setConfig(DEFAULT_CONFIG)}
            >
              Reset
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </>
  );
}

interface FeatureProps {
  title: string;
  thumnailUrl: string;
  channelTitle: string;
  isPlaying: boolean;
  onPlay(): void;
}

function Feature({
  title,
  thumnailUrl,
  channelTitle,
  isPlaying,
  onPlay,
  ...rest
}: FeatureProps) {
  return (
    <Box shadow="md" borderWidth="1px" {...rest}>
      <Flex alignItems="center">
        <Image src={thumnailUrl} width={74} />

        <Box ml={2}>
          <Flex>
            <Box mt={0.5}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</Box>

            <Box ml={2}>
              <Text
                fontSize="lg"
                onClick={onPlay}
                cursor="pointer"
                _hover={{ color: "teal" }}
              >
                {title}
              </Text>
              <Text fontSize="sm" color="gray">
                By {channelTitle}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

export const PlayIcon = createIcon({
  displayName: "PlayIcon",
  viewBox: "0 0 16 16",
  // path can also be an array of elements, if you have multiple paths, lines, shapes, etc.
  path: (
    <path
      fill="currentColor"
      d="M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5zM6 4.5l6 3.5-6 3.5z"
    />
  ),
});

export const PauseIcon = createIcon({
  displayName: "PauseIcon",
  viewBox: "0 0 16 16",
  // path can also be an array of elements, if you have multiple paths, lines, shapes, etc.
  path: (
    <path
      fill="currentColor"
      d="M8 0c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 14.5c-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5zM5 5h2v6h-2zM9 5h2v6h-2z"
    />
  ),
});

export default App;
