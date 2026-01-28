module Code exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode as Decode exposing (Decoder)
import Random
import String
import Time


main : Program () Model Msg
main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }


timeLimitSeconds : Int
timeLimitSeconds =
    30


type Status
    = Loading
    | Playing
    | GameOver


type alias Model =
    { motADeviner : String
    , definitions : List String -- definitions du mot a deviner
    , mot_propose : String -- mot propose par l'utilisateur
    , statut : Status -- etat du jeu (Loading, Playing, GameOver)
    , error : Maybe String -- message d'erreur si il y en a
    , timeLeft : Int
    , score : Int -- score du joueur
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { motADeviner = ""
      , definitions = []
      , mot_propose = ""
      , statut = Loading
      , error = Nothing -- pas d'erreur au debut
      , timeLeft = timeLimitSeconds
      , score = 0
      }
    , Random.generate NouveauMot (Random.uniform "Monkey" [ "apple", "banana", "mouse", "computer", "mountain", "river", "car", "devil", "cake", "cheese", "dog", "arab", "woman", "spice", "stink", "astronaut", "hair", "shoe", "network", "satellite", "football", "climber", "accident", "glasses", "fan", "shirt", "customer", "provider", "sun", "winter" ])
    )


type Msg
    = NouveauMot String -- nouveau mot a deviner
    | VerifierReponse -- verifier la reponse de l'utilisateur
    | GetDefinition (Result Http.Error String) -- recuperer les definitions du mot
    | ChangerReponse String -- changer la reponse proposee par l'utilisateur
    | Restart -- recommencer une partie
    | Tick Time.Posix -- evenement de tick pour le timer


subscriptions : Model -> Sub Msg
subscriptions model =
    case model.statut of
        Playing ->
            Time.every 1000 Tick

        -- tick toutes les secondes
        _ ->
            Sub.none



-- pas de subscription sinon


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NouveauMot mot ->
            -- un nouveau mot a deviner a ete genere
            ( { model
                | motADeviner = mot
                , definitions = []
                , mot_propose = ""
                , error = Nothing
                , statut = Loading
                , timeLeft = timeLimitSeconds
              }
            , Http.get
                { url = "https://api.dictionaryapi.dev/api/v2/entries/en/" ++ mot
                , expect = Http.expectString GetDefinition
                }
              -- lancer la requete HTTP pour recuperer les definitions
            )

        GetDefinition result ->
            -- resultat de la requete HTTP
            case result of
                Ok chain ->
                    -- requete reussie, parser les definitions
                    case Decode.decodeString definitionsDecoder chain of
                        Ok defs ->
                            ( { model | definitions = defs, statut = Playing }, Cmd.none )

                        Err _ ->
                            -- erreur de parsing
                            ( { model | error = Just "Erreur de parsing" }, Cmd.none )

                Err _ ->
                    -- erreur de requete HTTP
                    ( { model | error = Just "Erreur de chargement" }, Cmd.none )

        ChangerReponse val ->
            -- changer la reponse proposee par l'utilisateur
            ( { model | mot_propose = val }, Cmd.none )

        VerifierReponse ->
            -- verifier la reponse de l'utilisateur
            if String.toLower (String.trim model.mot_propose) == String.toLower (String.trim model.motADeviner) then
                -- reponse correcte (String.trim pour enlever les espaces inutiles)
                ( { model | score = model.score + 1, mot_propose = "" }, Random.generate NouveauMot (Random.uniform "Monkey" [ "apple", "banana", "mouse", "computer", "mountain", "river", "car", "devil", "cake", "cheese", "dog", "arab", "woman", "spice", "stink", "astronaut", "hair", "shoe", "network", "satellite", "football", "climber", "accident", "glasses", "fan", "shirt", "customer", "provider", "sun", "winter" ]) )
                -- lancer la generation d'un nouveau mot

            else
                ( { model | mot_propose = "" }, Cmd.none )

        -- reponse incorrecte, on ne fait rien a part vider le champ
        Restart ->
            -- recommencer une partie
            ( { model
                | statut = Loading
                , mot_propose = ""
                , definitions = []
                , error = Nothing
                , timeLeft = timeLimitSeconds
                , score = 0
              }
            , Random.generate NouveauMot (Random.uniform "apple" [ "banana", "computer", "mountain", "river", "monkey", "home" ])
            )

        Tick _ ->
            -- evenement de tick pour le timer
            case model.statut of
                Playing ->
                    if model.timeLeft <= 1 then
                        -- temps ecoule
                        ( { model | timeLeft = 0, statut = GameOver }, Cmd.none )
                        -- passer en etat GameOver

                    else
                        -- decremente le temps restant
                        ( { model | timeLeft = model.timeLeft - 1 }, Cmd.none )

                _ ->
                    -- pas en etat Playing, ne rien faire
                    ( model, Cmd.none )


definitionsDecoder : Decoder (List String)
definitionsDecoder =
    Decode.list entryDecoder
        -- decoder pour une liste d'entrées
        |> Decode.map List.concat



-- concaténer toutes les définitions


entryDecoder : Decoder (List String)
entryDecoder =
    Decode.field "meanings" (Decode.list meaningDecoder)
        |> Decode.map List.concat


meaningDecoder : Decoder (List String)
meaningDecoder =
    Decode.field "definitions" (Decode.list definitionDecoder)



-- decoder pour une liste de définitions


definitionDecoder : Decoder String
definitionDecoder =
    Decode.field "definition" Decode.string



-- decoder pour une définition


view : Model -> Html Msg
view model =
    div
        [ style "padding" "20px"
        , style "font-family" "sans-serif"
        , style "min-height" "100vh"
        , style "background-image" "url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Logo_INSA_Lyon_%282014%29.svg/2560px-Logo_INSA_Lyon_%282014%29.svg.png'), url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Love_Heart_with_arrow.svg/250px-Love_Heart_with_arrow.svg.png')"
        , style "background-size" "15%, 15%"
        , style "background-position" "95% 3%, 95% 97%"
        , style "background-attachment" "fixed"
        , style "background-repeat" "no-repeat, no-repeat"
        ]
        (h1 [] [ text "Guess It!" ]
            :: (case model.error of
                    Just err ->
                        [ div [ style "color" "red" ] [ text err ] ]

                    Nothing ->
                        []
               )
            ++ [ case model.statut of
                    Loading ->
                        text "Loading..."

                    Playing ->
                        div []
                            [ div [ style "margin" "10px 0", style "font-weight" "bold" ]
                                [ text ("Score: " ++ String.fromInt model.score ++ " | Time left: " ++ String.fromInt model.timeLeft ++ "s") ]
                            , h3 [] [ text "Meanings" ]
                            , ul [] (List.map (\d -> li [] [ text d ]) model.definitions)
                            , div [ style "margin-top" "20px" ]
                                [ label [] [ text "Type in to guess" ]
                                , br [] []
                                , input [ value model.mot_propose, onInput ChangerReponse, style "border" "2px solid black" ] []
                                , button [ onClick VerifierReponse, style "margin-left" "10px" ] [ text "Check" ]
                                ]
                            ]

                    GameOver ->
                        div []
                            [ h2 [ style "color" "crimson" ] [ text ("Game Over! Final Score: " ++ String.fromInt model.score) ]
                            , button [ onClick Restart ] [ text "Play Again" ]
                            ]
               ]
        )
